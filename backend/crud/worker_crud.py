from sqlalchemy.orm import Session
from sqlalchemy import select, func
from models.worker_model import Worker, WorkerCreate, WorkerUpdate

def create_worker(session: Session, worker_in: WorkerCreate) -> Worker:
    db_worker = Worker(**worker_in.model_dump())
    session.add(db_worker)
    session.commit()
    session.refresh(db_worker)
    return db_worker

def get_all_workers(session: Session, skip: int = 0, limit: int = 100):
    total = session.scalar(select(func.count()).select_from(Worker))
    workers = session.scalars(select(Worker).offset(skip).limit(limit)).all()
    return {"data": workers, "count": total}

def get_worker_by_id(session: Session, worker_id: int) -> Worker | None:
    return session.get(Worker, worker_id)

def update_worker(session: Session, db_worker: Worker, worker_in: WorkerUpdate) -> Worker:
    update_data = worker_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_worker, key, value)
    session.commit()
    session.refresh(db_worker)
    return db_worker

def delete_worker(session: Session, db_worker: Worker):
    session.delete(db_worker)
    session.commit()