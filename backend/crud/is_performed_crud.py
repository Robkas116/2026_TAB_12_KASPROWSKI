from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.is_performed_model import (
    IsPerformed,
    IsPerformedCreate,
    IsPerformedUpdate,
    IsPerformedPublic,
    IsPerformedsPublic,
)


def create_is_performed(
    *, session: Session, is_performed_in: IsPerformedCreate
) -> IsPerformedPublic:
    db_obj = IsPerformed(
        price=is_performed_in.price,
        date=is_performed_in.date,
        state=is_performed_in.state,
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_all_is_performeds(
    *, session: Session, skip: int = 0, limit: int = 100
) -> IsPerformedsPublic:
    total_count = session.scalar(select(func.count()).select_from(IsPerformed)) or 0
    statement = select(IsPerformed).offset(skip).limit(limit)
    is_performeds = session.scalars(statement).all()
    return IsPerformedsPublic(data=is_performeds, count=total_count)


def get_is_performed_by_id(
    *, session: Session, is_performed_id: int
) -> IsPerformedPublic | None:
    return session.get(IsPerformed, is_performed_id)


def update_is_performed(
    *,
    session: Session,
    db_is_performed: IsPerformed,
    is_performed_in: IsPerformedUpdate,
) -> IsPerformedPublic:
    update_data = is_performed_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_is_performed, field, value)

    session.add(db_is_performed)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise ValueError("Invalid update payload for is_performed.") from exc
    session.refresh(db_is_performed)
    return db_is_performed


def delete_is_performed(*, session: Session, db_is_performed: IsPerformed) -> None:
    session.delete(db_is_performed)
    session.commit()
    return None
