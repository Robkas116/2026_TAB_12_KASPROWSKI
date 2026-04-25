from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from crud import action_crud
from database.database import get_db
from models.action_model import ActionCreate, ActionPublic, ActionUpdate, ActionsPublic

router = APIRouter(prefix="/action", tags=["Actions"])


@router.post("/", response_model=ActionPublic, status_code=status.HTTP_201_CREATED)
def create_action(action_in: ActionCreate, db: Session = Depends(get_db)):
    """
    Create a new Action in the database.
    """
    return action_crud.create_action(session=db, action_in=action_in)


@router.get("/", response_model=ActionsPublic)
def get_actions(
    db: Session = Depends(get_db),
    skip: int = Query(0, description="Number of items to skip"),
    limit: int = Query(100, le=1000, description="Max number of items to return"),
):
    """
    Retrieve all Actions with pagination.
    """
    return action_crud.get_all_actions(session=db, skip=skip, limit=limit)


@router.get("/{action_id}", response_model=ActionPublic)
def get_action(action_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific Action by its ID.
    """
    action = action_crud.get_action_by_id(session=db, action_id=action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Action not found."
        )
    return action


@router.patch("/{action_id}", response_model=ActionPublic)
def update_action(
    action_id: int, action_in: ActionUpdate, db: Session = Depends(get_db)
):
    """
    Update an Action. Only the fields provided in the request body will be updated.
    """
    db_action = action_crud.get_action_by_id(session=db, action_id=action_id)
    if not db_action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Action not found."
        )

    return action_crud.update_action(
        session=db, db_action=db_action, action_in=action_in
    )


@router.delete("/{action_id}", response_model=dict[str, str])
def delete_action(action_id: int, db: Session = Depends(get_db)):
    """
    Delete an Action by its ID.
    """
    db_action = action_crud.get_action_by_id(session=db, action_id=action_id)
    if not db_action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Action not found."
        )

    action_crud.delete_action(session=db, db_action=db_action)
    return {"detail": "Action deleted successfully."}
