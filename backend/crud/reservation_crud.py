from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models.reservation_model import (
    Reservation,
    ReservationCreate,
    ReservationUpdate,
    ReservationPublic,
    ReservationsPublic,
    Reservation_state_enum,
)
from models.is_performed_model import IsPerformed
from models.action_model import Action
from models.worker_model import Worker


def _has_overlapping_reservation(
    *,
    session: Session,
    vehicle_id: int,
    start: datetime,
    end: datetime,
    exclude_reservation_id: int | None = None,
) -> bool:
    statement = select(Reservation).where(
        Reservation.vehicle_id == vehicle_id,
        Reservation.state != Reservation_state_enum.CANCELED,
        Reservation.date_start_planned < end,
        Reservation.date_end_planned > start,
    )
    if exclude_reservation_id is not None:
        statement = statement.where(Reservation.id != exclude_reservation_id)

    result = session.scalars(statement).first()
    return result is not None


def create_reservation(
    *, session: Session, reservation_in: ReservationCreate
) -> ReservationPublic:
    """Creates a new reservation record in the database.

    The function converts the provided Pydantic model into a SQLAlchemy model,
    adds it to the session, commits the transaction, and refreshes the instance
    to get the generated ID.

    Args:
        session (Session): The database session.
        reservation_in (ReservationCreate): The validated Pydantic schema with data for the new reservation.

    Returns:
        ReservationPublic: The newly created reservation object.
    """

    if reservation_in.date_end_planned <= reservation_in.date_start_planned:
        raise ValueError(
            "Data zakończenia musi być późniejsza niż data rozpoczęcia."
        )

    if _has_overlapping_reservation(
        session=session,
        vehicle_id=reservation_in.vehicle_id,
        start=reservation_in.date_start_planned,
        end=reservation_in.date_end_planned,
    ):
        raise ValueError(
            "Wybrany termin rezerwacji pokrywa się z istniejącą rezerwacją dla tego pojazdu."
        )

    db_obj = Reservation(
        date_start_planned=reservation_in.date_start_planned,
        date_end_planned=reservation_in.date_end_planned,
        price=reservation_in.price,
        purpose=reservation_in.purpose,
        vehicle_id=reservation_in.vehicle_id,
        worker_id=reservation_in.worker_id,
        service_name=reservation_in.service_name,
    )

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_all_reservations(
    *, session: Session, skip: int = 0, limit: int = 100, worker_id: int | None = None
) -> ReservationsPublic:
    """Retrieves all reservations from the database with optional pagination and worker filtering.

    Args:
        session (Session): The database session.
        skip (int, optional): Number of records to skip (offset). Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 100.
        worker_id (int, optional): ID of the worker to filter reservations for.

    Returns:
        ReservationsPublic: A Pydantic schema containing the list of reservations and the total count.
    """
    statement = select(Reservation)
    count_statement = select(func.count()).select_from(Reservation)

    if worker_id is not None:
        statement = statement.where(Reservation.worker_id == worker_id)
        count_statement = count_statement.where(Reservation.worker_id == worker_id)

    total_count = session.scalar(count_statement) or 0
    reservations = session.scalars(statement.offset(skip).limit(limit)).all()

    return ReservationsPublic(data=reservations, count=total_count)


def get_reservation_by_id(
    *, session: Session, reservation_id: int
) -> ReservationPublic | None:
    """Finds a reservation by its ID in the database.

    Args:
        session (Session): The database session.
        reservation_id (int): The ID of the reservation to retrieve.

    Returns:
        ReservationPublic | None: The reservation object if found, otherwise None.
    """
    return session.get(Reservation, reservation_id)


def update_reservation(
    *, session: Session, reservation_id: int, reservation_in: ReservationUpdate
) -> ReservationPublic | None:
    """Updates a reservation record in the database.

    The function retrieves the existing reservation by ID, updates its fields with the provided data,
    commits the transaction, and refreshes the instance to get the updated data.

    Args:
        session (Session): The database session.
        reservation_id (int): The ID of the reservation to update.
        reservation_in (ReservationUpdate): The validated Pydantic schema with data for updating the reservation.

    Returns:
        ReservationPublic | None: The updated reservation object if found and updated, otherwise None.
    """
    db_reservation = session.get(Reservation, reservation_id)
    if not db_reservation:
        return None

    update_data = reservation_in.model_dump(exclude_unset=True)
    new_start = update_data.get("date_start_planned", db_reservation.date_start_planned)
    new_end = update_data.get("date_end_planned", db_reservation.date_end_planned)

    if new_end <= new_start:
        raise ValueError(
            "Data zakończenia musi być późniejsza niż data rozpoczęcia."
        )

    if _has_overlapping_reservation(
        session=session,
        vehicle_id=db_reservation.vehicle_id,
        start=new_start,
        end=new_end,
        exclude_reservation_id=db_reservation.id,
    ):
        raise ValueError(
            "Wybrany termin rezerwacji pokrywa się z istniejącą rezerwacją dla tego pojazdu."
        )

    # Reset state to CREATED if dates are changed and state is not explicitly updated
    if "state" not in update_data:
        has_date_changes = False
        if "date_start_planned" in update_data and update_data["date_start_planned"] != db_reservation.date_start_planned:
            has_date_changes = True
        if "date_end_planned" in update_data and update_data["date_end_planned"] != db_reservation.date_end_planned:
            has_date_changes = True
            
        if has_date_changes:
            db_reservation.state = Reservation_state_enum.CREATED

    for field, value in update_data.items():
        setattr(db_reservation, field, value)

    # Sync performance state if it is a service reservation
    # Sync performance state for ALL linked actions (service and exploitation)
    from models.is_performed_model import IsPerformed, State as IsPerformedState
    ips = session.scalars(
        select(IsPerformed).where(IsPerformed.reservation_id == db_reservation.id)
    ).all()
    
    for ip in ips:
        if db_reservation.state == Reservation_state_enum.CANCELED:
            ip.state = IsPerformedState.CANCELED
        elif db_reservation.state == Reservation_state_enum.CREATED:
            ip.state = IsPerformedState.AWAITING
        elif db_reservation.state == Reservation_state_enum.IN_PROGRESS:
            ip.state = IsPerformedState.PERFORMED
        elif db_reservation.state == Reservation_state_enum.COMPLETED:
            ip.state = IsPerformedState.COMPLETED
        session.add(ip)

    session.add(db_reservation)
    session.commit()
    session.refresh(db_reservation)
    return db_reservation


def auto_transition_reservations(*, session: Session) -> int:
    """Auto-transition reservation states based on current time:
    - created -> in_progress when date_start_planned has passed
    - in_progress -> completed when date_end_planned has passed
    Returns the number of reservations updated.
    """
    from datetime import datetime as dt

    now = dt.now()
    updated = 0

    # Transition: created -> in_progress (start date passed)
    started = list(
        session.scalars(
            select(Reservation).where(
                Reservation.state == Reservation_state_enum.CREATED,
                Reservation.date_start_planned <= now,
            )
        ).all()
    )
    for r in started:
        r.state = Reservation_state_enum.IN_PROGRESS
        session.add(r)
        updated += 1

    # Transition: in_progress -> completed (end date passed)
    completed = list(
        session.scalars(
            select(Reservation).where(
                Reservation.state == Reservation_state_enum.IN_PROGRESS,
                Reservation.date_end_planned <= now,
            )
        ).all()
    )
    for r in completed:
        r.state = Reservation_state_enum.COMPLETED
        session.add(r)
        updated += 1

    if updated:
        session.commit()
    return updated


def auto_complete_services(*, session: Session) -> int:
    """Mark service reservations as completed when their end date has passed.
    Returns the number of reservations updated.
    """
    from datetime import datetime as dt

    now = dt.now()
    statement = (
        select(Reservation)
        .where(
            Reservation.purpose == "service",
            Reservation.state == Reservation_state_enum.CREATED,
            Reservation.date_end_planned <= now,
        )
    )
    expired = list(session.scalars(statement).all())
    for r in expired:
        r.state = Reservation_state_enum.COMPLETED
        session.add(r)
    if expired:
        session.commit()
    return len(expired)


def delete_reservation(*, session: Session, db_reservation: Reservation) -> None:
    """Deletes a reservation record from the database.

    Args:
        session (Session): The database session.
        db_reservation (Reservation): The reservation object to delete.

    Returns:
        None
    """
    session.delete(db_reservation)
    session.commit()
    return None


def get_reservations_for_vehicle(
    *, session: Session, vehicle_id: int, skip: int = 0, limit: int = 100
) -> ReservationsPublic:
    """Get all reservations for a specific vehicle, ordered by start date desc."""
    count_statement = (
        select(func.count())
        .select_from(Reservation)
        .where(Reservation.vehicle_id == vehicle_id)
    )
    statement = (
        select(Reservation)
        .where(Reservation.vehicle_id == vehicle_id)
        .order_by(Reservation.date_start_planned.desc())
        .offset(skip)
        .limit(limit)
    )
    total_count = session.scalar(count_statement) or 0
    reservations = list(session.scalars(statement).all())
    return ReservationsPublic(data=reservations, count=total_count)


def get_exploitations_for_vehicle(
    *, session: Session, vehicle_id: int, skip: int = 0, limit: int = 100
) -> list:
    """Get all exploitation IsPerformed records for a vehicle's reservations.
    Returns raw tuples: (IsPerformed, Action.name, Reservation.date_start_planned,
                         Reservation.date_end_planned, Worker.name)
    """
    statement = (
        select(
            IsPerformed,
            Action.name,
            Reservation.date_start_planned,
            Reservation.date_end_planned,
            Worker.name,
        )
        .join(Action, IsPerformed.action_id == Action.id)
        .join(Reservation, IsPerformed.reservation_id == Reservation.id)
        .join(Worker, Reservation.worker_id == Worker.id)
        .where(
            Reservation.vehicle_id == vehicle_id,
            Action.type == "exploitation",
        )
        .order_by(IsPerformed.date.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(session.execute(statement).all())
