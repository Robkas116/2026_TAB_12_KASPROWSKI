from sqlalchemy import select, func
from sqlalchemy.orm import Session

from models.worker_model import Worker, WorkerCreate, WorkerUpdate, WorkersPrivate


def create_worker(*, session: Session, worker_in: WorkerCreate) -> Worker:
    """Creates a new worker in the database.

    Args:
        session: The database session.
        worker_in: The validated Pydantic schema with data for the new worker.

    Returns:
        The newly created worker object.
    """
    db_worker = Worker(**worker_in.model_dump())
    session.add(db_worker)
    session.commit()
    session.refresh(db_worker)
    return db_worker


def get_worker_by_id(*, session: Session, worker_id: int) -> Worker | None:
    """Retrieves a worker by their unique ID.

    Args:
        session: The database session.
        worker_id: The primary key of the worker to find.

    Returns:
        The found worker object, or None if not found.
    """
    return session.get(Worker, worker_id)


def get_worker_by_email(*, session: Session, email: str) -> Worker | None:
    """Retrieves a worker by their email address.

    Args:
        session: The database session.
        email: The exact email address to search for.

    Returns:
        The found worker object, or None if not found.
    """
    statement = select(Worker).where(Worker.email == email)
    return session.scalar(statement)


def get_all_workers(*, session: Session, skip: int = 0, limit: int = 100) -> WorkersPrivate:
    """Retrieves all workers with pagination and packages them into a Private schema.

    Args:
        session: The database session.
        skip: The number of items to skip (offset).
        limit: The maximum number of items to return.

    Returns:
        A Pydantic schema containing a list of workers and the total count.
    """
    statement = select(Worker).offset(skip).limit(limit)
    count_statement = select(func.count()).select_from(Worker)

    workers = session.scalars(statement).all()
    total_count = session.scalar(count_statement) or 0

    return WorkersPrivate(data=workers, count=total_count)


def update_worker(*, session: Session, db_worker: Worker, worker_in: WorkerUpdate) -> Worker:
    """Updates an existing worker's data based on the provided fields.

    Only the fields explicitly set in the input schema will be updated.

    Args:
        session: The database session.
        db_worker: The existing worker object from the database.
        worker_in: The validated Pydantic schema containing updated fields.

    Returns:
        The updated worker object.
    """
    update_data = worker_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_worker, field, value)
    
    session.commit()
    session.refresh(db_worker)
    return db_worker


def delete_worker(*, session: Session, db_worker: Worker) -> None:
    """Removes a worker from the database.

    Args:
        session: The database session.
        db_worker: The worker object to delete.
    """
    session.delete(db_worker)
    session.commit()

    