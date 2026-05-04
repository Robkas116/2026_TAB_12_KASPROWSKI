from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from crud import set_of_equipment_crud, equipment_crud
from database.database import get_db
from models.set_of_equipment_model import (
    SetOfEquipmentCreate,
    SetOfEquipmentPublic,
    SetOfEquipmentUpdate,
    SetOfEquipmentsPublic,
)

router = APIRouter(prefix="/set-of-equipment", tags=["Sets of Equipment"])


@router.post(
    "/", response_model=SetOfEquipmentPublic, status_code=status.HTTP_201_CREATED
)
def create_set_of_equipment(
    set_of_equipment_in: SetOfEquipmentCreate, db: Session = Depends(get_db)
):
    """Creates a new Set of Equipment in the database.

    Args:
        set_of_equipment_in: The validated Pydantic schema with data for the new set.
        db: The database session dependency.

    Returns:
        The newly created set of equipment object.

    Raises:
        HTTPException: If a database integrity constraint fails, such as providing
            a non-existent version_id (Status 400).
    """
    try:
        return set_of_equipment_crud.create_set_of_equipment(
            session=db, set_of_equipment_in=set_of_equipment_in
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. Ensure the provided version_id exists.",
        )


@router.get("/", response_model=SetOfEquipmentsPublic)
def get_sets_of_equipments(
    db: Session = Depends(get_db),
    skip: int = Query(0, description="Number of items to skip (offset)"),
    limit: int = Query(100, le=1000, description="Max number of items to return"),
    version_id: Optional[int] = Query(
        None, description="Filter sets by a specific Version ID"
    ),
):
    """Retrieves all Sets of Equipment, optionally filtered by version.
    Args:
        db: The database session dependency.
        skip: The number of items to skip (offset).
        limit: The maximum number of items to return.
        version_id: The ID of the version to filter by.
    Returns:
        A list of sets of equipment and the total count in the database.
    """
    return set_of_equipment_crud.get_all_sets_of_equipments(
        session=db, skip=skip, limit=limit, version_id=version_id
    )


@router.get("/{set_of_equipment_id}", response_model=SetOfEquipmentPublic)
def get_set_of_equipment(set_of_equipment_id: int, db: Session = Depends(get_db)):
    """Retrieves a specific Set of Equipment by its ID.

    Queries the database for a Set of Equipment matching the provided ID. If it
    does not exist, an HTTP error is raised.

    Args:
        set_of_equipment_id: The primary key of the set of equipment to find.
        db: The database session dependency.

    Returns:
        The found set of equipment object.

    Raises:
        HTTPException: If the set of equipment with the specified ID is not found (Status 404).
    """
    db_set = set_of_equipment_crud.get_set_of_equipment_by_id(
        session=db, set_of_equipment_id=set_of_equipment_id
    )
    if not db_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Set of Equipment not found."
        )

    return db_set


@router.patch("/{set_of_equipment_id}", response_model=SetOfEquipmentPublic)
def update_set_of_equipment(
    set_of_equipment_id: int,
    set_of_equipment_in: SetOfEquipmentUpdate,
    db: Session = Depends(get_db),
):
    """Updates a Set of Equipment.

    Only the fields provided in the request body will be updated.

    Args:
        set_of_equipment_id: The primary key of the set of equipment to update.
        set_of_equipment_in: The validated Pydantic schema containing updated fields.
        db: The database session dependency.

    Returns:
        The updated set of equipment object.

    Raises:
        HTTPException: If the set is not found (Status 404) or if a database
            integrity error occurs during the update (Status 400).
    """
    db_set = set_of_equipment_crud.get_set_of_equipment_by_id(
        session=db, set_of_equipment_id=set_of_equipment_id
    )
    if not db_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Set of Equipment not found."
        )

    try:
        return set_of_equipment_crud.update_set_of_equipment(
            session=db,
            db_set_of_equipment=db_set,
            set_of_equipment_in=set_of_equipment_in,
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. Ensure the new version_id exists.",
        )


@router.post(
    "/{set_of_equipment_id}/equipment/{equipment_id}",
    response_model=SetOfEquipmentPublic,
)
def add_equipment_to_set(
    set_of_equipment_id: int, equipment_id: int, db: Session = Depends(get_db)
):
    """Adds an existing Equipment to a specific Set of Equipment.

    Args:
        set_of_equipment_id: The ID of the set.
        equipment_id: The ID of the equipment to add.
        db: The database session dependency.

    Returns:
        The updated set of equipment object.

    Raises:
        HTTPException: If the set or the equipment is not found (404),
            or if the equipment is already in the set (400).
    """

    db_set = set_of_equipment_crud.get_set_of_equipment_by_id(
        session=db, set_of_equipment_id=set_of_equipment_id
    )
    if not db_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Set of Equipment not found."
        )

    db_equipment = equipment_crud.get_equipment_by_id(
        session=db, equipment_id=equipment_id
    )
    if not db_equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found."
        )

    if db_equipment in db_set.equipments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Equipment is already assigned to this Set.",
        )

    return set_of_equipment_crud.add_equipment_to_set(
        session=db, db_set=db_set, db_equipment=db_equipment
    )


@router.delete("/{set_of_equipment_id}", response_model=dict[str, str])
def delete_set_of_equipment(set_of_equipment_id: int, db: Session = Depends(get_db)):
    """Deletes a Set of Equipment by its ID.

    Attempts to remove the set of equipment from the database.

    Args:
        set_of_equipment_id: The primary key of the set of equipment to delete.
        db: The database session dependency.

    Returns:
        A dictionary containing a success message.

    Raises:
        HTTPException: If the set of equipment is not found (Status 404).
    """
    db_set = set_of_equipment_crud.get_set_of_equipment_by_id(
        session=db, set_of_equipment_id=set_of_equipment_id
    )
    if not db_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Set of Equipment not found."
        )

    try:
        set_of_equipment_crud.delete_set_of_equipment(
            session=db, db_set_of_equipment=db_set
        )
        return {"message": "Set of Equipment has been deleted successfully."}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete this Set of Equipment due to existing database constraints.",
        )


@router.delete(
    "/{set_of_equipment_id}/equipment/{equipment_id}",
    response_model=SetOfEquipmentPublic,
)
def remove_equipment_from_set(
    set_of_equipment_id: int, equipment_id: int, db: Session = Depends(get_db)
):
    """Removes an Equipment from a specific Set of Equipment.
    Args:
        set_of_equipment_id: The ID of the set.
        equipment_id: The ID of the equipment to remove.
        db: The database session dependency.
    Returns:
        The updated set of equipment object after removal.
    """
    db_set = set_of_equipment_crud.get_set_of_equipment_by_id(
        session=db, set_of_equipment_id=set_of_equipment_id
    )
    if not db_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Set of Equipment not found."
        )

    db_equipment = equipment_crud.get_equipment_by_id(
        session=db, equipment_id=equipment_id
    )
    if not db_equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Equipment not found."
        )

    if db_equipment not in db_set.equipments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Equipment is not assigned to this Set.",
        )

    return set_of_equipment_crud.remove_equipment_from_set(
        session=db, db_set=db_set, db_equipment=db_equipment
    )
