from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models.action_model import (
    Action,
    ActionCreate,
    ActionUpdate,
    ActionPublic,
    ActionsPublic,
)


def create_action(*, session: Session, action_in: ActionCreate) -> ActionPublic:

    db_obj = Action(name=action_in.name, type=action_in.type)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_all_actions(
    *, session: Session, skip: int = 0, limit: int = 100
) -> ActionsPublic:
    total_count = session.scalar(select(func.count()).select_from(Action)) or 0
    statement = select(Action).offset(skip).limit(limit)
    actions = session.scalars(statement).all()
    return ActionsPublic(data=actions, count=total_count)


def get_action_by_id(*, session: Session, action_id: int) -> ActionPublic | None:
    return session.get(Action, action_id)


def update_action(
    *, session: Session, db_action: Action, action_in: ActionUpdate
) -> ActionPublic:
    update_data = action_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_action, field, value)

    session.add(db_action)
    session.commit()
    session.refresh(db_action)
    return db_action


def delete_action(*, session: Session, db_action: Action) -> None:
    session.delete(db_action)
    session.commit()
    return None
