from sqlalchemy.orm import Session
from sqlalchemy import select, func
from models.caretaker_model import (
    Caretaker,
    CaretakerCreate,
    CaretakerPublic,
    CaretakerUpdate,
    CaretakersPublic,
)
from models.vehicle_model import Vehicle
from models.vehmodel_model import VehModel
from models.make_model import Make
from models.version_model import Version
from models.reservation_model import Reservation, Reservation_state_enum


def create_caretaker(
    session: Session, caretaker_in: CaretakerCreate
) -> CaretakerPublic:
    db_caretaker = Caretaker(**caretaker_in.model_dump())
    session.add(db_caretaker)
    session.commit()
    session.refresh(db_caretaker)
    return db_caretaker


def get_caretaker_by_id(session: Session, caretaker_id: int) -> CaretakerPublic | None:
    return session.get(Caretaker, caretaker_id)


def get_all_caretakers(
    session: Session, skip: int = 0, limit: int = 100
) -> CaretakersPublic:
    total = session.scalar(select(func.count()).select_from(Caretaker))
    caretakers = session.scalars(select(Caretaker).offset(skip).limit(limit)).all()
    return {"data": caretakers, "count": total}


def update_caretaker(
    session: Session, db_caretaker: Caretaker, caretaker_in: CaretakerUpdate
) -> CaretakerPublic:
    update_data = caretaker_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_caretaker, key, value)
    session.commit()
    session.refresh(db_caretaker)
    return db_caretaker


def delete_caretaker(session: Session, db_caretaker: Caretaker):
    session.delete(db_caretaker)
    session.commit()


def is_worker_caretaker_for_vehicle(
    *, session: Session, worker_id: int, vehicle_id: int
) -> bool:
    """Check if a worker is an active caretaker for a specific vehicle."""
    caretaker = session.scalar(
        select(Caretaker).where(
            Caretaker.worker_id == worker_id,
            Caretaker.vehicle_id == vehicle_id,
            Caretaker.date_end.is_(None),
        )
    )
    return caretaker is not None


def get_caretaker_vehicles(
    *, session: Session, worker_id: int
) -> list[tuple]:
    """Get all vehicles where the worker is an active caretaker.
    Returns raw tuples: (Vehicle, Make.name, VehModel.name, Version.destination)
    """
    statement = (
        select(Vehicle, Make.name, VehModel.name, Version.destination)
        .join(Caretaker, Caretaker.vehicle_id == Vehicle.id)
        .join(VehModel, Vehicle.veh_model_id == VehModel.id)
        .join(Make, VehModel.make_id == Make.id)
        .join(Version, Vehicle.version_id == Version.id)
        .where(
            Caretaker.worker_id == worker_id,
            Caretaker.date_end.is_(None),
        )
    )
    return session.execute(statement).all()


def get_calendar_reservations_for_vehicle(
    *, session: Session, vehicle_id: int
) -> list[Reservation]:
    """Get all non-canceled reservations for a vehicle (for calendar blocking)."""
    statement = (
        select(Reservation)
        .where(
            Reservation.vehicle_id == vehicle_id,
            Reservation.state != Reservation_state_enum.CANCELED,
        )
        .order_by(Reservation.date_start_planned.asc())
    )
    return list(session.scalars(statement).all())
