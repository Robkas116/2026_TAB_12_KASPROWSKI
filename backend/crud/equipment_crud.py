from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models.equipment_model import (
    Equipment,
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentsPublic,
    EquipmentPublic,
)


def create_equipment(
    *, session: Session, equipment_in: EquipmentCreate
) -> EquipmentPublic:
    """Creates a new equipment record in the database.

    The function converts the provided Pydantic model into a SQLAlchemy model,
    adds it to the session, commits the transaction, and refreshes the instance
    to get the generated ID.

    Args:
        session (Session): The database session.
        equipment_in (EquipmentCreate): The validated Pydantic schema with data for the new equipment.

    Returns:
        EquipmentPublic: The newly created equipment object.
    """
    db_obj = Equipment(name=equipment_in.name)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_all_equipments(
    *, session: Session, skip: int = 0, limit: int = 100
) -> EquipmentsPublic:
    """Retrieves a list of equipment from the database with pagination.

    Args:
        session (Session): The database session.
        skip (int, optional): Number of records to skip (offset). Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 100.

    Returns:
        EquipmentsPublic: A Pydantic schema containing the list of equipment and the total count.
    """
    total_count = session.scalar(select(func.count()).select_from(Equipment)) or 0

    statement = select(Equipment).offset(skip).limit(limit)
    equipments = session.scalars(statement).all()

    return EquipmentsPublic(data=equipments, count=total_count)


def get_equipment_by_id(
    *, session: Session, equipment_id: int
) -> EquipmentPublic | None:
    """Finds an equipment by its ID in the database.

    Args:
        session (Session): The database session.
        equipment_id (int): The primary key of the equipment to find.

    Returns:
        EquipmentPublic | None: The found equipment object, or None if it does not exist.
    """
    return session.get(Equipment, equipment_id)


def update_equipment(
    *, session: Session, db_equipment: Equipment, equipment_in: EquipmentUpdate
) -> EquipmentPublic:
    """Updates an existing equipment record in the database.

    Only the fields that are explicitly set in the equipment_in model will be updated.

    Args:
        session (Session): The database session.
        db_equipment (Equipment): The existing SQLAlchemy model instance to be updated.
        equipment_in (EquipmentUpdate): The validated Pydantic schema containing updated fields.

    Returns:
        EquipmentPublic: The updated equipment object.
    """
    update_data = equipment_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_equipment, field, value)

    session.add(db_equipment)
    session.commit()
    session.refresh(db_equipment)
    return db_equipment


def delete_equipment(*, session: Session, db_equipment: Equipment) -> None:
    """Deletes an equipment record from the database.

    Args:
        session (Session): The database session.
        db_equipment (Equipment): The existing SQLAlchemy model instance to delete.

    Returns:
        None
    """
    session.delete(db_equipment)
    session.commit()
    return None
