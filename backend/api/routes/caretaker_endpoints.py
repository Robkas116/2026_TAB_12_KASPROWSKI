from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from crud import caretaker_crud
from database.database import get_db
from models.caretaker_model import (
    CaretakerCreate,
    CaretakerPublic,
    CaretakerUpdate,
    CaretakersPublic,
)

router = APIRouter(prefix="/caretaker", tags=["Caretakers"])


@router.post("/", response_model=CaretakerPublic, status_code=status.HTTP_201_CREATED)
def create_caretaker(caretaker_in: CaretakerCreate, db: Session = Depends(get_db)):

    try:
        return caretaker_crud.create_caretaker(session=db, caretaker_in=caretaker_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Worker (worker_id) with set id does not exist.",
        )


@router.get("/", response_model=CaretakersPublic)
def get_caretakers(
    db: Session = Depends(get_db),
    skip: int = Query(0, description="Number of items to skip"),
    limit: int = Query(100, le=1000, description="Max number of items to return"),
):
    """
    Retrieve all Caretakers with pagination.
    """
    return caretaker_crud.get_all_caretakers(session=db, skip=skip, limit=limit)


@router.get("/{caretaker_id}", response_model=CaretakerPublic)
def get_caretaker(caretaker_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific Caretaker by its ID.
    """
    caretaker = caretaker_crud.get_caretaker_by_id(
        session=db, caretaker_id=caretaker_id
    )
    if not caretaker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Caretaker not found."
        )
    return caretaker


@router.patch("/{caretaker_id}", response_model=CaretakerPublic)
def update_caretaker(
    caretaker_id: int, caretaker_in: CaretakerUpdate, db: Session = Depends(get_db)
):
    db_caretaker = caretaker_crud.get_caretaker_by_id(
        session=db, caretaker_id=caretaker_id
    )
    if not db_caretaker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Caretaker not found."
        )
    return caretaker_crud.update_caretaker(
        session=db, db_caretaker=db_caretaker, caretaker_in=caretaker_in
    )


@router.delete("/{caretaker_id}", response_model=dict[str, str])
def delete_caretaker(caretaker_id: int, db: Session = Depends(get_db)):
    """
    Delete a Caretaker by its ID.
    Prevents deletion if there are dependent models due to RESTRICT rule.
    """
    db_caretaker = caretaker_crud.get_caretaker_by_id(
        session=db, caretaker_id=caretaker_id
    )
    if not db_caretaker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Caretaker not found."
        )

    try:
        caretaker_crud.delete_caretaker(session=db, db_caretaker=db_caretaker)
        return {"message": "Caretaker has been deleted successfully"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete this Caretaker because there are Vehicles/Workers/Reservations associated with it.",
        )
