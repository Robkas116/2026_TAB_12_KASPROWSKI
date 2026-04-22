from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from crud import vehmodel_crud
from database.database import get_db
from models.vehmodel_model import VehModelCreate, VehModelPublic, VehModelUpdate

# Adjust the import paths according to your actual project structure
# from database.database import get_db
# from schemas.vehmmodel_schema import ModelCreate, ModelUpdate, ModelPublic
# from schemas.common import Message
# from crud import vehmmodel as crud_model

router = APIRouter(
    prefix="/model",
    tags=["Vehicle Models"]
)

@router.post("/", response_model=VehModelPublic, status_code=status.HTTP_201_CREATED)
def create_model(
    model_in: VehModelCreate, 
    db: Session = Depends(get_db)
):
    """
    Create a new Vehicle Model in the database.
    Catches IntegrityError in case the provided make_id does not exist.
    """
    try:
        return vehmodel_crud.create_vehmodel(session=db, model_in=model_in)
    except IntegrityError:
        # Rollback the session if the Foreign Key constraint fails
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided make_id does not exist in the database."
        )


@router.get("/{model_id}", response_model=VehModelPublic)
def get_model(
    model_id: int, 
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific Vehicle Model by its ID.
    """
    db_model = vehmodel_crud.get_vehmodel_by_id(session=db, model_id=model_id)
    if not db_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Vehicle Model not found."
        )
    
    return db_model


@router.patch("/{model_id}", response_model=VehModelPublic)
def update_model(
    model_id: int, 
    model_in: VehModelUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update a Vehicle Model. Only the fields provided in the request body will be updated.
    """
    db_model = vehmodel_crud.get_vehmodel_by_id(session=db, model_id=model_id)
    if not db_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Vehicle Model not found."
        )
    
    try:
        return vehmodel_crud.update_vehmodel(session=db, db_model=db_model, model_in=model_in)
    except IntegrityError:
        # Catch FK errors if the user tries to update to a non-existent make_id
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided make_id does not exist in the database."
        )


@router.delete("/{model_id}", response_model=dict[str,str])
def delete_model(
    model_id: int, 
    db: Session = Depends(get_db)
):
    """
    Delete a Vehicle Model by its ID. 
    Returns a simple success message string via the Message schema upon completion.
    """
    db_model = vehmodel_crud.get_vehmodel_by_id(session=db, model_id=model_id)
    if not db_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Vehicle Model not found."
        )
    
    try:
        vehmodel_crud.delete_vehmodel(session=db, db_model=db_model)
        return {"message": "Vehicle Model has been deleted successfully."}
    except IntegrityError:
        # Looking ahead at your ERD diagram: Model is connected to Vehicle
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete this Model because there are specific Vehicles associated with it."
        )
    