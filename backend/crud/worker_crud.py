from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models.worker_model import (
    Worker,
    WorkerCreate,
    WorkerUpdate,
    WorkersPublic,
    WorkerPublic,
)


from core.security import get_password_hash


def normalize_email(email: str) -> str:
    return email.strip().lower()

def create_worker(*, session: Session, worker_in: WorkerCreate) -> Worker:
    """
    Creates a new worker in the database using the provided data.
    """
    db_obj = Worker(
        name=worker_in.name,
        email=normalize_email(worker_in.email),
        hashed_password=get_password_hash(worker_in.password)
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_worker_by_email(*, session: Session, email: str) -> Worker | None:
    """
    Finds a worker by its email in the database. Returns None if not found.
    """
    normalized_email = normalize_email(email)
    return session.scalar(select(Worker).where(func.lower(Worker.email) == normalized_email))


def get_all_workers(
    *, session: Session, skip: int = 0, limit: int = 100
) -> WorkersPublic:
    """Retrieves a list of vehicle workers from the database.

    Args:
        skip (int, optional): Number of records to skip (offset). Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 100.

    Returns:
        WorkersPublic: A Pydantic schema containing the list of workers and the total count.
    """
    total_count = session.scalar(select(func.count()).select_from(Worker)) or 0

    statement = select(Worker).offset(skip).limit(limit)
    workers = session.scalars(statement).all()
    return WorkersPublic(data=workers, count=total_count)


def get_worker_by_id(*, session: Session, worker_id: int) -> WorkerPublic | None:
    """
    Finds a worker by its ID in the database. Returns None if not found.
    """
    return session.get(Worker, worker_id)


def update_worker(
    *, session: Session, db_worker: Worker, worker_in: WorkerUpdate
) -> WorkerPublic:
    """
    Updating a worker in the database.
    """

    update_data = worker_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_worker, field, value)

    session.add(db_worker)
    session.commit()
    session.refresh(db_worker)
    return db_worker


def update_password(*, session: Session, db_worker: Worker, new_password: str) -> Worker:
    db_worker.hashed_password = get_password_hash(new_password)
    session.add(db_worker)
    session.commit()
    session.refresh(db_worker)
    return db_worker


def delete_worker(*, session: Session, db_worker: Worker) -> None:
    """
    Deleting a worker from the database.
    """
    session.delete(db_worker)
    session.commit()
    return None
