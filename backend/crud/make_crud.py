from sqlalchemy.orm import Session
from sqlalchemy import select

from models.make_model import Make, MakeCreate, MakeUpdate

# Zakładam, że importujesz odpowiednie modele i schematy z Twojego projektu
# from models.vehicle import Make
# from schemas.make import MakeCreate, MakeUpdate

def create_make(*, session: Session, make_in: MakeCreate) -> Make:
    """
    Creates a new make in the database using the provided data.
        The make_in parameter is expected to be a Pydantic model (MakeCreate) that contains the data for the new make.
        The function converts this Pydantic model into a SQLAlchemy model (Make), adds it to the session, commits the transaction, and refreshes the instance to get the generated ID.
        Finally, it returns the newly created Make object.
    """
    db_obj = Make(
        name=make_in.name
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj

def get_make_by_id(*, session: Session, make_id: int) -> Make | None:
    """
    Finds a make by its ID in the database. Returns None if not found.
    """
    # getting by primary key
    return session.get(Make, make_id)

def update_make(*, session: Session, db_make: Make, make_in: MakeUpdate) -> Make:
    """
    Updating a make in the database.
    """
    # update only the fields that were provided (exclude_unset=True)
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
