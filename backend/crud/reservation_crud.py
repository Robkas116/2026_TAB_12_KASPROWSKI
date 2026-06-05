from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models.reservation_model import (
    Reservation,
    ReservationCreate,
    ReservationUpdate,
    ReservationPublic,
    ReservationsPublic,
)


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

    db_obj = Reservation(
        date_start_planned=reservation_in.date_start_planned,
        date_end_planned=reservation_in.date_end_planned,
        price=reservation_in.price,
        purpose=reservation_in.purpose,
        vehicle_id=reservation_in.vehicle_id,
        worker_id=reservation_in.worker_id,

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

    for field, value in update_data.items():
        setattr(db_reservation, field, value)

    session.add(db_reservation)
    session.commit()
    session.refresh(db_reservation)
    return db_reservation


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
