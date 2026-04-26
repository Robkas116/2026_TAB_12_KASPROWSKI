from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models.version_model import (
    Version,
    VersionCreate,
    VersionUpdate,
    VersionsPublic,
    VersionPublic,
)


def create_version(*, session: Session, version_in: VersionCreate) -> VersionPublic:
    """Creates a new version record in the database.

    The function converts the provided Pydantic model into a SQLAlchemy model,
    adds it to the session, commits the transaction, and refreshes the instance
    to get the generated ID.

    Args:
        session (Session): The database session.
        version_in (VersionCreate): The validated Pydantic schema with data for the new version.

    Returns:
        VersionPublic: The newly created version object.
    """
    db_obj = Version(destination=version_in.destination)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_all_versions(
    *, session: Session, skip: int = 0, limit: int = 100
) -> VersionsPublic:
    """Retrieves a list of versions from the database with pagination.

    Args:
        session (Session): The database session.
        skip (int, optional): Number of records to skip (offset). Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 100.

    Returns:
        VersionsPublic: A Pydantic schema containing the list of versions and the total count.
    """
    total_count = session.scalar(select(func.count()).select_from(Version)) or 0

    statement = select(Version).offset(skip).limit(limit)
    versions = session.scalars(statement).all()

    return VersionsPublic(data=versions, count=total_count)


def get_version_by_id(*, session: Session, version_id: int) -> VersionPublic | None:
    """Finds a version by its ID in the database.

    Args:
        session (Session): The database session.
        version_id (int): The primary key of the version to find.

    Returns:
        VersionPublic | None: The found version object, or None if it does not exist.
    """
    return session.get(Version, version_id)


def update_version(
    *, session: Session, db_version: Version, version_in: VersionUpdate
) -> VersionPublic:
    """Updates an existing version record in the database.

    Only the fields that are explicitly set in the version_in model will be updated.

    Args:
        session (Session): The database session.
        db_version (Version): The existing SQLAlchemy model instance to be updated.
        version_in (VersionUpdate): The validated Pydantic schema containing updated fields.

    Returns:
        VersionPublic: The updated version object.
    """
    update_data = version_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_version, field, value)

    session.add(db_version)
    session.commit()
    session.refresh(db_version)
    return db_version


def delete_version(*, session: Session, db_version: Version) -> None:
    """Deletes a version record from the database.

    Args:
        session (Session): The database session.
        db_version (Version): The existing SQLAlchemy model instance to delete.

    Returns:
        None
    """
    session.delete(db_version)
    session.commit()
    return None
