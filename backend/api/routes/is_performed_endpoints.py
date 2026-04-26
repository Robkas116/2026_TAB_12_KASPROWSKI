from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from crud import is_performed_crud
from database.database import get_db
from models.is_performed_model import (
    IsPerformedCreate,
    IsPerformedPublic,
    IsPerformedUpdate,
    IsPerformedsPublic,
)

router = APIRouter(prefix="/is-performed", tags=["Is Performed"])


@router.post("/", response_model=IsPerformedPublic, status_code=status.HTTP_201_CREATED)
def create_is_performed(
    is_performed_in: IsPerformedCreate, db: Session = Depends(get_db)
):
    """
    Create a new IsPerformed record in the database.
    """
    return is_performed_crud.create_is_performed(
        session=db, is_performed_in=is_performed_in
    )


@router.get("/", response_model=IsPerformedsPublic)
def get_is_performeds(
    db: Session = Depends(get_db),
    skip: int = Query(0, description="Number of items to skip"),
    limit: int = Query(100, le=1000, description="Max number of items to return"),
):
    """
    Retrieve all IsPerformed records with pagination.
    """
    return is_performed_crud.get_all_is_performeds(session=db, skip=skip, limit=limit)


@router.get("/{is_performed_id}", response_model=IsPerformedPublic)
def get_is_performed(is_performed_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific IsPerformed record by its ID.
    """
    is_performed = is_performed_crud.get_is_performed_by_id(
        session=db, is_performed_id=is_performed_id
    )
    if not is_performed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IsPerformed not found."
        )
    return is_performed


@router.patch("/{is_performed_id}", response_model=IsPerformedPublic)
def update_is_performed(
    is_performed_id: int,
    is_performed_in: IsPerformedUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an IsPerformed record. Only provided fields are updated.
    """
    db_is_performed = is_performed_crud.get_is_performed_by_id(
        session=db, is_performed_id=is_performed_id
    )
    if not db_is_performed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IsPerformed not found."
        )

    try:
        return is_performed_crud.update_is_performed(
            session=db,
            db_is_performed=db_is_performed,
            is_performed_in=is_performed_in,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete("/{is_performed_id}", response_model=dict[str, str])
def delete_is_performed(is_performed_id: int, db: Session = Depends(get_db)):
    """
    Delete an IsPerformed record by its ID.
    """
    db_is_performed = is_performed_crud.get_is_performed_by_id(
        session=db, is_performed_id=is_performed_id
    )
    if not db_is_performed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IsPerformed not found."
        )

    is_performed_crud.delete_is_performed(session=db, db_is_performed=db_is_performed)
    return {"detail": "IsPerformed deleted successfully."}
