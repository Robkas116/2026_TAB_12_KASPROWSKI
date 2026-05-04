from sqlalchemy.orm import Session
from sqlalchemy import select, func
from models.caretaker_model import (
    Caretaker,
    CaretakerCreate,
    CaretakerPublic,
    CaretakerUpdate,
    CaretakersPublic,
)


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
