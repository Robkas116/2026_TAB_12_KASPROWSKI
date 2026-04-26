from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models.vehicle_model import Vehicle, VehicleCreate, VehicleUpdate, VehiclesPublic, VehiclePublic


def create_vehicle(*, session: Session, vehicle_in: VehicleCreate) -> VehiclePublic:
    """Creates a new vehicle record in the database.

    The function converts the provided Pydantic model into a SQLAlchemy model, 
    adds it to the session, commits the transaction, and refreshes the instance 
    to get the generated ID.

    Args:
        session (Session): The database session.
        vehicle_in (VehicleCreate): The validated Pydantic schema with data for the new vehicle.

    Returns:
        VehiclePublic: The newly created vehicle object.
    """
    db_obj = Vehicle(
        veh_model_id=vehicle_in.veh_model_id,
        version_id=vehicle_in.version_id,
        worker_id=vehicle_in.worker_id
    )

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj
def get_all_vehicles(*, session: Session, skip: int = 0, limit: int = 100) -> VehiclesPublic:
    """Retrieves all vehicles from the database with optional pagination.

    Args:
        session (Session): The database session.
        skip (int, optional): Number of records to skip (offset). Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 100.

    Returns:
        VehiclesPublic: A Pydantic schema containing the list of vehicles and the total count.
    """
    statement = select(Vehicle)
    count_statement = select(func.count()).select_from(Vehicle)

    total_count = session.scalar(count_statement) or 0
    vehicles = session.scalars(statement.offset(skip).limit(limit)).all()
    
    return VehiclesPublic(data=vehicles, count=total_count)
def get_vehicle_by_id(*, session: Session, vehicle_id: int) -> VehiclePublic | None:
    """Finds a vehicle by its ID in the database.

    Args:
        session (Session): The database session.
        vehicle_id (int): The ID of the vehicle to retrieve.

    Returns:
        VehiclePublic | None: The vehicle object if found, otherwise None.
    """
    return session.get(Vehicle, vehicle_id)
def update_vehicle(*, session: Session, vehicle_id: int, vehicle_in: VehicleUpdate) -> VehiclePublic | None:
    """Updates an existing vehicle record in the database.

    The function retrieves the existing vehicle by ID, updates its fields with the provided data,
    commits the transaction, and returns the updated vehicle.

    Args:
        session (Session): The database session.
        vehicle_id (int): The ID of the vehicle to update.
        vehicle_in (VehicleUpdate): The validated Pydantic schema with data for updating the vehicle.

    Returns:
        VehiclePublic | None: The updated vehicle object if found and updated, otherwise None.
    """
    db_obj = session.get(Vehicle, vehicle_id)
    if not db_obj:
        return None

    if vehicle_in.veh_model_id is not None:
        db_obj.veh_model_id = vehicle_in.veh_model_id
    if vehicle_in.version_id is not None:
        db_obj.version_id = vehicle_in.version_id
    if vehicle_in.worker_id is not None:
        db_obj.worker_id = vehicle_in.worker_id

    session.commit()
    session.refresh(db_obj)
    return db_obj
def delete_vehicle(*, session: Session, vehicle_id: int) -> bool:
    """Deletes a vehicle record from the database.

    The function retrieves the vehicle by ID, deletes it from the session, and commits the transaction.

    Args:
        session (Session): The database session.
        vehicle_id (int): The ID of the vehicle to delete.

    Returns:
        bool: True if the vehicle was found and deleted, False if not found.
    """
    db_obj = session.get(Vehicle, vehicle_id)
    if not db_obj:
        return False

    session.delete(db_obj)
    session.commit()
    return True
