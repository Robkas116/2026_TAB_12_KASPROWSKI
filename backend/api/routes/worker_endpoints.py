from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database.database import get_db
from crud import worker_crud
from models.worker_model import WorkerCreate, WorkerUpdate, WorkerPrivate, WorkersPrivate

router = APIRouter(
    prefix="/worker",
    tags=["Worker"]
)


@router.post("/", response_model=WorkerPrivate, status_code=status.HTTP_201_CREATED)
def create_worker(
    worker_in: WorkerCreate, 
    db: Session = Depends(get_db)
):
    """Creates a new Worker in the database.
    
    Checks if the provided email is already in use before attempting to 
    create the record to ensure uniqueness.

    Args:
        worker_in: The validated Pydantic schema containing the new worker's data.
        db: The database session dependency.

    Returns:
        The newly created worker object containing private data.

    Raises:
        HTTPException: If the email is already in use (Status 400) or if a 
            database integrity error occurs (Status 400).
    """
    # Check if the email is already registered
    existing_worker = worker_crud.get_worker_by_email(session=db, email=worker_in.email)
    if existing_worker:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A worker with this email already exists."
        )

    try:
        return worker_crud.create_worker(session=db, worker_in=worker_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error during creation."
        )


@router.get("/", response_model=WorkersPrivate)
def get_workers(
    db: Session = Depends(get_db),
    skip: int = Query(0, description="Number of items to skip (offset)"),
    limit: int = Query(100, le=1000, description="Max number of items to return")
):
    """Retrieves all Workers with pagination.

    During development, this endpoint returns the full Private schema, 
    including sensitive data such as email addresses.

    Args:
        db: The database session dependency.
        skip: The number of items to skip (offset).
        limit: The maximum number of items to return.

    Returns:
        A paginated list of workers and the total count.
    """
    return worker_crud.get_all_workers(session=db, skip=skip, limit=limit)


@router.get("/{worker_id}", response_model=WorkerPrivate)
def get_worker(
    worker_id: int, 
    db: Session = Depends(get_db)
):
    """Retrieves a specific Worker by their ID.

    Args:
        worker_id: The primary key of the worker to find.
        db: The database session dependency.

    Returns:
        The found worker object.

    Raises:
        HTTPException: If the worker is not found (Status 404).
    """
    db_worker = worker_crud.get_worker_by_id(session=db, worker_id=worker_id)
    if not db_worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Worker not found."
        )
    return db_worker


@router.patch("/{worker_id}", response_model=WorkerPrivate)
def update_worker(
    worker_id: int, 
    worker_in: WorkerUpdate, 
    db: Session = Depends(get_db)
):
    """Updates a Worker's details.

    Only the fields provided in the request body will be modified. Ensures
    that any new email address provided is not already taken by another worker.

    Args:
        worker_id: The primary key of the worker to update.
        worker_in: The validated Pydantic schema containing updated fields.
        db: The database session dependency.

    Returns:
        The updated worker object.

    Raises:
        HTTPException: If the worker is not found (Status 404), if the new email
            is already in use (Status 400), or if a database constraint fails (Status 400).
    """
    db_worker = worker_crud.get_worker_by_id(session=db, worker_id=worker_id)
    if not db_worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Worker not found."
        )
    
    # Check if the requested email is available
    if worker_in.email:
        existing_worker = worker_crud.get_worker_by_email(session=db, email=worker_in.email)
        if existing_worker and existing_worker.id != worker_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already in use by another worker."
            )

    try:
        return worker_crud.update_worker(session=db, db_worker=db_worker, worker_in=worker_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error during update."
        )


@router.delete("/{worker_id}", response_model=dict[str, str])
def delete_worker(
    worker_id: int, 
    db: Session = Depends(get_db)
):
    """Deletes a Worker by their ID.

    Args:
        worker_id: The primary key of the worker to delete.
        db: The database session dependency.

    Returns:
        A dictionary containing a success message.

    Raises:
        HTTPException: If the worker is not found (Status 404).
    """
    db_worker = worker_crud.get_worker_by_id(session=db, worker_id=worker_id)
    if not db_worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Worker not found."
        )
    
    worker_crud.delete_worker(session=db, db_worker=db_worker)
    return {"message": "Worker has been deleted successfully."}

    