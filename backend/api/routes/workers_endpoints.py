from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from crud import worker_crud
from database.database import get_db
from models.worker_model import (
    WorkerCreate,
    WorkerPublic,
    WorkerUpdate,
    WorkersPublic,
)

router = APIRouter(prefix="/workers", tags=["Workers"])

@router.post("/", response_model=WorkerPublic, status_code=status.HTTP_201_CREATED)
def create_worker(worker_in: WorkerCreate, db: Session = Depends(get_db)):
    try:
        return worker_crud.create_worker(session=db, worker_in=worker_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Worker with this email already exists.",
        )

@router.get("/", response_model=WorkersPublic)
def get_workers(
    db: Session = Depends(get_db),
    skip: int = Query(0, description="Offset"),
    limit: int = Query(100, le=1000, description="Limit"),
):
    return worker_crud.get_all_workers(session=db, skip=skip, limit=limit)

@router.get("/{worker_id}", response_model=WorkerPublic)
def get_worker(worker_id: int, db: Session = Depends(get_db)):
    db_worker = worker_crud.get_worker_by_id(session=db, worker_id=worker_id)
    if not db_worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found."
        )
    return db_worker

@router.patch("/{worker_id}", response_model=WorkerPublic)
def update_worker(
    worker_id: int, worker_in: WorkerUpdate, db: Session = Depends(get_db)
):
    db_worker = worker_crud.get_worker_by_id(session=db, worker_id=worker_id)
    if not db_worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found."
        )
    return worker_crud.update_worker(session=db, db_worker=db_worker, worker_in=worker_in)

@router.delete("/{worker_id}", response_model=dict[str, str])
def delete_worker(worker_id: int, db: Session = Depends(get_db)):
    db_worker = worker_crud.get_worker_by_id(session=db, worker_id=worker_id)
    if not db_worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found."
        )
    try:
        worker_crud.delete_worker(session=db, db_worker=db_worker)
        return {"message": "Worker has been deleted successfully."}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete Worker because they are assigned as a Caretaker.",
        )