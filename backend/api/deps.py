from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from core.security import ALGORITHM, SECRET_KEY
from database.database import get_db
from crud import worker_crud
from models.worker_model import Worker

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/v1/login/access-token"
)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> Worker:
    try:
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
        worker_id = int(str(user_id).strip())
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = worker_crud.get_worker_by_id(session=db, worker_id=worker_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def verify_caretaker_of_vehicle(
    vehicle_id: int,
    current_user: Worker,
    db: Session,
) -> None:
    """Verify that the current user is an active caretaker of the given vehicle.
    Raises HTTPException 403 if not.
    """
    from crud import caretaker_crud

    if not caretaker_crud.is_worker_caretaker_for_vehicle(
        session=db, worker_id=current_user.id, vehicle_id=vehicle_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nie jesteś opiekunem tego pojazdu.",
        )
