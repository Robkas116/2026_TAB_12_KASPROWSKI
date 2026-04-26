from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from crud import equipment_crud
from database.database import get_db
from models.equipment_model import (
    EquipmentCreate,
    EquipmentPublic,
    EquipmentUpdate,
    EquipmentsPublic,
)

router = APIRouter(prefix="/equipment", tags=["Equipment"])


@router.post("/", response_model=EquipmentPublic, status_code=status.HTTP_201_CREATED)
def create_equipment(equipment_in: EquipmentCreate, db: Session = Depends(get_db)):
    """Creates a new Equipment in the database.

    Args:
        equipment_in: The validated Pydantic schema with data for the new equipment.
        db: The database session dependency.

    Returns:
        The newly created equipment object.

    Raises:
        HTTPException: If a database integrity constraint fails (Status 400).
    """
    try:
        return equipment_crud.create_equipment(session=db, equipment_in=equipment_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. Ensure the provided data is valid.",
        )


@router.get("/", response_model=EquipmentsPublic)
def get_equipments(
    db: Session = Depends(get_db),
    skip: int = Query(0, description="Number of items to skip (offset)"),
    limit: int = Query(100, le=1000, description="Max number of items to return"),
):
    """Retrieves all Equipments with pagination.

    Args:
        db: The database session dependency.
        skip: The number of items to skip (offset).
        limit: The maximum number of items to return.

    Returns:
        A list of equipments and the total count of equipments in the database.
    """
    return equipment_crud.get_all_equipments(session=db, skip=skip, limit=limit)


@router.get("/{equipment_id}", response_model=EquipmentPublic)
def get_equipment(equipment_id: int, db: Session = Depends(get_db)):
    """Retrieves a specific Equipment by its ID.

    Queries the database for an Equipment matching the provided ID. If the
    equipment does not exist, an HTTP error is raised.

    Args:
        equipment_id: The primary key of the equipment to find.
        db: The database session dependency.

    Returns:
        The found equipment object.

    Raises:
        HTTPException: If the equipment with the specified ID is not found (Status 404).
    """
    db_equipment = equipment_crud.get_equipment_by_id(
        session=db, equipment_id=equipment_id
    )
    if not db_equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found."
        )

    return db_equipment


@router.patch("/{equipment_id}", response_model=EquipmentPublic)
def update_equipment(
    equipment_id: int, equipment_in: EquipmentUpdate, db: Session = Depends(get_db)
):
    """Updates an Equipment.

    Only the fields provided in the request body will be updated.

    Args:
        equipment_id: The primary key of the equipment to update.
        equipment_in: The validated Pydantic schema containing updated fields.
        db: The database session dependency.

    Returns:
        The updated equipment object.

    Raises:
        HTTPException: If the equipment is not found (Status 404) or if a database
            integrity error occurs during the update (Status 400).
    """
    db_equipment = equipment_crud.get_equipment_by_id(
        session=db, equipment_id=equipment_id
    )
    if not db_equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found."
        )

    try:
        return equipment_crud.update_equipment(
            session=db, db_equipment=db_equipment, equipment_in=equipment_in
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error during update.",
        )


@router.delete("/{equipment_id}", response_model=dict[str, str])
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    """Deletes an Equipment by its ID.

    Attempts to remove the equipment from the database. If there are dependent
    records (like Sets of Equipment) that prevent deletion, an
    HTTP conflict error is raised.

    Args:
        equipment_id: The primary key of the equipment to delete.
        db: The database session dependency.

    Returns:
        A dictionary containing a success message.

    Raises:
        HTTPException: If the equipment is not found (Status 404) or if deletion
            fails due to foreign key constraints (Status 409).
    """
    db_equipment = equipment_crud.get_equipment_by_id(
        session=db, equipment_id=equipment_id
    )
    if not db_equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found."
        )

    try:
        equipment_crud.delete_equipment(session=db, db_equipment=db_equipment)
        return {"message": "Equipment has been deleted successfully."}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete this Equipment because it is currently assigned to one or more Sets of Equipment.",
        )
