from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from crud import make_crud
from database.database import get_db
from models.make_model import MakeCreate, MakePublic, MakeUpdate
# Adjust imports based on your actual project structure
# from database.database import get_db
# from schemas.make import MakeCreate, MakeUpdate, MakePublic
# from crud import make as crud_make

router = APIRouter(
    prefix="/make",
    tags=["Makes"]
)

@router.post("/", response_model=MakePublic, status_code=status.HTTP_201_CREATED)
def create_make(
    make_in: MakeCreate, 
    db: Session = Depends(get_db)
):
    """
    Create a new Make in the database.
    """
    return make_crud.create_make(session=db, make_in=make_in)


@router.get("/{make_id}", response_model=MakePublic)
def get_make(
    make_id: int, 
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific Make by its ID.
    """
    make = make_crud.get_make_by_id(session=db, make_id=make_id)
    if not make:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Make not found."
        )
    return make


@router.patch("/{make_id}", response_model=MakePublic)
def update_make(
    make_id: int, 
    make_in: MakeUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update a Make. Only the fields provided in the request body will be updated.
    """
    db_make = make_crud.get_make_by_id(session=db, make_id=make_id)
    if not db_make:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Make not found."
        )
    
    return make_crud.update_make(session=db, db_make=db_make, make_in=make_in)


@router.delete("/{make_id}", response_model=dict[str,str])
def delete_make(
    make_id: int, 
    db: Session = Depends(get_db)
):
    """
    Delete a Make by its ID. 
    Prevents deletion if there are dependent models due to RESTRICT rule.
    """
    db_make = make_crud.get_make_by_id(session=db, make_id=make_id)
    if not db_make:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Make not found."
        )
    
    try:
        make_crud.delete_make(session=db, db_make=db_make)
        return {"message": "Make has been deleted successfully"}
    except IntegrityError:
        # Rollback is necessary after an IntegrityError to keep the session usable
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete this Make because there are Vehicles/Models associated with it."
        )
    