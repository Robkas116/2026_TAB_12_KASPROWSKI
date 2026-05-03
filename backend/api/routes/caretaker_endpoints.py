from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from crud import caretaker_crud
from database.database import get_db
from models.caretaker_model import CaretakerCreate, CaretakerPublic, CaretakerUpdate

router = APIRouter(prefix="/caretakers", tags=["Caretakers"])

@router.post("/", response_model=CaretakerPublic, status_code=status.HTTP_201_CREATED)
def create_caretaker(caretaker_in: CaretakerCreate, db: Session = Depends(get_db)):

    try:
        return caretaker_crud.create_caretaker(session=db, caretaker_in=caretaker_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Worker (worker_id) with set id does not exist."
        )

@router.patch("/{caretaker_id}", response_model=CaretakerPublic)
def update_caretaker(
    caretaker_id: int, caretaker_in: CaretakerUpdate, db: Session = Depends(get_db)
):
    db_caretaker = caretaker_crud.get_caretaker_by_id(session=db, caretaker_id=caretaker_id)
    if not db_caretaker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Caretaker not found."
        )
    return caretaker_crud.update_caretaker(session=db, db_caretaker=db_caretaker, caretaker_in=caretaker_in)