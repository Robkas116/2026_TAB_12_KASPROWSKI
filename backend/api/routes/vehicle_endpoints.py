from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from crud import vehicle_crud
from database.database import get_db
from models.vehicle_model import (
    VehicleCreate,
    VehiclePublic,
    VehicleUpdate,
    VehiclesPublic,
)

router = APIRouter(prefix="/vehicle", tags=["Vehicles"])


@router.post("/", response_model=VehiclePublic, status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle_in: VehicleCreate, db: Session = Depends(get_db)):
    """Creates a new Vehicle in the database.

    Args:
        vehicle_in: The validated Pydantic schema with data for the new vehicle.
        db: The database session dependency.

    Returns:
        The newly created vehicle object.

    Raises:
        HTTPException: If a database integrity constraint fails, such as providing
            non-existent veh_model_id or version_id (Status 400).
    """
    try:
        return vehicle_crud.create_vehicle(session=db, vehicle_in=vehicle_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. Ensure the provided veh_model_id and version_id exist.",
        )


@router.get("/", response_model=VehiclesPublic)
def get_vehicles(
    db: Session = Depends(get_db),
    skip: int = Query(0, description="Number of items to skip (offset)"),
    limit: int = Query(100, le=1000, description="Max number of items to return"),
):
    """Retrieves all Vehicles with optional pagination.

    Args:
        db: The database session dependency.
        skip: Number of records to skip (offset).
        limit: Maximum number of records to return.

    Returns:
        A Pydantic schema containing the list of vehicles and the total count.
    """
    return vehicle_crud.get_all_vehicles(session=db, skip=skip, limit=limit)


@router.get("/{vehicle_id}", response_model=VehiclePublic)
def get_vehicle_by_id(vehicle_id: int, db: Session = Depends(get_db)):
    """Retrieves a Vehicle by its ID.

    Args:
        vehicle_id: The ID of the vehicle to retrieve.
        db: The database session dependency.

    Returns:
        The vehicle object if found.

    Raises:
        HTTPException: If the vehicle with the specified ID does not exist (Status 404).
    """
    vehicle = vehicle_crud.get_vehicle_by_id(session=db, vehicle_id=vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    return vehicle


@router.patch("/{vehicle_id}", response_model=VehiclePublic)
def update_vehicle(
    vehicle_id: int, vehicle_in: VehicleUpdate, db: Session = Depends(get_db)
):
    """Updates an existing Vehicle.

    Args:
        vehicle_id: The ID of the vehicle to update.
        vehicle_in: The validated Pydantic schema with data for updating the vehicle.
        db: The database session dependency.

    Returns:
        The updated vehicle object if found and updated.

    Raises:
        HTTPException: If the vehicle with the specified ID does not exist (Status 404).
    """
    db_vehicle = vehicle_crud.get_vehicle_by_id(session=db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )

    try:
        return vehicle_crud.update_vehicle(
            session=db, vehicle_id=vehicle_id, vehicle_in=vehicle_in
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. Ensure the provided veh_model_id and version_id exist.",
        )


@router.delete("/{vehicle_id}", response_model=dict[str, str])
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    """Deletes a Vehicle by its ID.

    Args:
        vehicle_id: The ID of the vehicle to delete.
        db: The database session dependency.

    Returns:
        A success message if the vehicle was deleted.

    Raises:
        HTTPException: If the vehicle with the specified ID does not exist (Status 404).
    """
    db_vehicle = vehicle_crud.get_vehicle_by_id(session=db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )

    try:
        vehicle_crud.delete_vehicle(session=db, db_vehicle=db_vehicle)
        return {"message": "Vehicle has been deleted successfully."}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete this Vehicle because there are specific Caretaker associated with it.",
        )
