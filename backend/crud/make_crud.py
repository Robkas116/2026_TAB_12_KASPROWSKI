from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models.make_model import Make, MakeCreate, MakeUpdate, MakesPublic, MakePublic


def create_make(*, session: Session, make_in: MakeCreate) -> MakePublic:
    """
    Creates a new make in the database using the provided data.
        The make_in parameter is expected to be a Pydantic model (MakeCreate) that contains the data for the new make.
        The function converts this Pydantic model into a SQLAlchemy model (Make), adds it to the session, commits the transaction, and refreshes the instance to get the generated ID.
        Finally, it returns the newly created Make object.
    """
    db_obj = Make(name=make_in.name)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_all_makes(*, session: Session, skip: int = 0, limit: int = 100) -> MakesPublic:
    """Retrieves a list of vehicle makes from the database.

    Args:
        skip (int, optional): Number of records to skip (offset). Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 100.

    Returns:
        MakesPublic: A Pydantic schema containing the list of makes and the total count.
    """
    total_count = session.scalar(select(func.count()).select_from(Make)) or 0

    statement = select(Make).offset(skip).limit(limit)
    makes = session.scalars(statement).all()
    return MakesPublic(data=makes, count=total_count)


def get_make_by_id(*, session: Session, make_id: int) -> MakePublic | None:
    """
    Finds a make by its ID in the database. Returns None if not found.
    """
    return session.get(Make, make_id)


def update_make(*, session: Session, db_make: Make, make_in: MakeUpdate) -> MakePublic:
    """
    Updating a make in the database.
    """

    update_data = make_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_make, field, value)

    session.add(db_make)
    session.commit()
    session.refresh(db_make)
    return db_make


def delete_make(*, session: Session, db_make: Make) -> None:
    """
    Deleting a make from the database.
    """
    session.delete(db_make)
    session.commit()
    return None
