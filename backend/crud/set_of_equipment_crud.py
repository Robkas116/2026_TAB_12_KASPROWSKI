from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, Session

from models.set_of_equipment_model import (
    SetOfEquipment,
    SetOfEquipmentCreate,
    SetOfEquipmentUpdate,
    SetOfEquipmentsPublic,
    SetOfEquipmentPublic,
)

from models.equipment_model import Equipment


def create_set_of_equipment(
    *, session: Session, set_of_equipment_in: SetOfEquipmentCreate
) -> SetOfEquipmentPublic:
    """Creates a new set of equipment record in the database.

    The function converts the provided Pydantic model into a SQLAlchemy model,
    adds it to the session, commits the transaction, and refreshes the instance
    to get the generated ID.

    Args:
        session (Session): The database session.
        set_of_equipment_in (SetOfEquipmentCreate): The validated Pydantic schema with data for the new set of equipment.

    Returns:
        SetOfEquipmentPublic: The newly created set of equipment object.
    """
    db_obj = SetOfEquipment(
        name=set_of_equipment_in.name, version_id=set_of_equipment_in.version_id
    )

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_all_sets_of_equipments(
    *, session: Session, skip: int = 0, limit: int = 100, version_id: int | None = None
) -> SetOfEquipmentsPublic:
    """Retrieves all sets of equipment from the database with optional pagination and filtering by version.

    Args:
        session (Session): The database session.
        skip (int, optional): Number of records to skip (offset). Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 100.
        version_id (int | None, optional): The ID of the version to filter by. Defaults to None.

    Returns:
        SetOfEquipmentsPublic: A Pydantic schema containing the list of sets of equipment and the total count.
    """
    statement = select(SetOfEquipment)
    count_statement = select(func.count()).select_from(SetOfEquipment)

    if version_id is not None:
        statement = statement.where(SetOfEquipment.version_id == version_id)
        count_statement = count_statement.where(SetOfEquipment.version_id == version_id)

    statement = statement.options(selectinload(SetOfEquipment.equipments))

    total_count = session.scalar(count_statement) or 0
    sets_of_equipments = session.scalars(statement.offset(skip).limit(limit)).all()

    return SetOfEquipmentsPublic(data=sets_of_equipments, count=total_count)


def get_set_of_equipment_by_id(
    *, session: Session, set_of_equipment_id: int
) -> SetOfEquipmentPublic | None:
    """Finds a set of equipment by its ID in the database.

    Args:
        session (Session): The database session.
        set_of_equipment_id (int): The primary key of the set of equipment to find.

    Returns:
        SetOfEquipmentPublic | None: The found set of equipment object, or None if it does not exist.
    """
    statement = (
        select(SetOfEquipment)
        .where(SetOfEquipment.id == set_of_equipment_id)
        .options(selectinload(SetOfEquipment.equipments))
    )
    return session.scalar(statement)


def update_set_of_equipment(
    *,
    session: Session,
    db_set_of_equipment: SetOfEquipment,
    set_of_equipment_in: SetOfEquipmentUpdate,
) -> SetOfEquipmentPublic:
    """Updates an existing set of equipment record in the database.

    Only the fields that are explicitly set in the set_of_equipment_in model will be updated.

    Args:
        session (Session): The database session.
        db_set_of_equipment (SetOfEquipment): The existing SQLAlchemy model instance to be updated.
        set_of_equipment_in (SetOfEquipmentUpdate): The validated Pydantic schema containing updated fields.

    Returns:
        SetOfEquipmentPublic: The updated set of equipment object.
    """
    update_data = set_of_equipment_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_set_of_equipment, field, value)

    session.add(db_set_of_equipment)
    session.commit()
    session.refresh(db_set_of_equipment)
    return db_set_of_equipment


def delete_set_of_equipment(
    *, session: Session, db_set_of_equipment: SetOfEquipment
) -> None:
    """Deletes a set of equipment record from the database.

    Args:
        session (Session): The database session.
        db_set_of_equipment (SetOfEquipment): The existing SQLAlchemy model instance to delete.

    Returns:
        None
    """
    session.delete(db_set_of_equipment)
    session.commit()
    return None


def add_equipment_to_set(
    *, session: Session, db_set: SetOfEquipment, db_equipment: Equipment
) -> SetOfEquipment:
    """Adds an existing equipment to a set of equipment.

    Args:
        session (Session): The database session.
        db_set (SetOfEquipment): The set of equipment to which the equipment will be added.
        db_equipment (Equipment): The equipment to be added to the set.

    Returns:
        The updated set of equipment.
    """
    if db_equipment not in db_set.equipments:
        db_set.equipments.append(db_equipment)
        session.commit()
        session.refresh(db_set)

    return db_set


def remove_equipment_from_set(
    *, session: Session, db_set: SetOfEquipment, db_equipment: Equipment
) -> SetOfEquipment:
    """Removes the equipment association from a set of equipment.

    Args:
        session (Session): The database session.
        db_set (SetOfEquipment): The set of equipment to decouple from its equipment.
        db_equipment (Equipment): The equipment to be removed from the set.

    Returns:
        The updated set of equipment.
    """
    if db_equipment in db_set.equipments:
        db_set.equipments.remove(db_equipment)
        session.commit()
        session.refresh(db_set)
    return db_set
