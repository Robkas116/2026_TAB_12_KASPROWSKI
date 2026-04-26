from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from crud import version_crud
from database.database import get_db
from models.version_model import (
    VersionCreate,
    VersionPublic,
    VersionUpdate,
    VersionsPublic,
)

router = APIRouter(prefix="/version", tags=["Versions"])


@router.post("/", response_model=VersionPublic, status_code=status.HTTP_201_CREATED)
def create_version(version_in: VersionCreate, db: Session = Depends(get_db)):
    """Creates a new Version in the database.

    Args:
        version_in: The validated Pydantic schema with data for the new version.
        db: The database session dependency.

    Returns:
        The newly created version object.

    Raises:
        HTTPException: If a database integrity constraint fails (Status 400).
    """
    try:
        return version_crud.create_version(session=db, version_in=version_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. Ensure the provided data is valid.",
        )


@router.get("/", response_model=VersionsPublic)
def get_versions(
    db: Session = Depends(get_db),
    skip: int = Query(0, description="Number of items to skip (offset)"),
    limit: int = Query(100, le=1000, description="Max number of items to return"),
):
    """Retrieves all Versions with pagination.

    Args:
        db: The database session dependency.
        skip: The number of items to skip (offset).
        limit: The maximum number of items to return.

    Returns:
        A list of versions and the total count of versions in the database.
    """
    return version_crud.get_all_versions(session=db, skip=skip, limit=limit)


@router.get("/{version_id}", response_model=VersionPublic)
def get_version(version_id: int, db: Session = Depends(get_db)):
    """Retrieves a specific Version by its ID.

    Queries the database for a Version matching the provided ID. If the
    version does not exist, an HTTP error is raised.

    Args:
        version_id: The primary key of the version to find.
        db: The database session dependency.

    Returns:
        The found version object.

    Raises:
        HTTPException: If the version with the specified ID is not found (Status 404).
    """
    db_version = version_crud.get_version_by_id(session=db, version_id=version_id)
    if not db_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Version not found."
        )

    return db_version


@router.patch("/{version_id}", response_model=VersionPublic)
def update_version(
    version_id: int, version_in: VersionUpdate, db: Session = Depends(get_db)
):
    """Updates a Version.

    Only the fields provided in the request body will be updated.

    Args:
        version_id: The primary key of the version to update.
        version_in: The validated Pydantic schema containing updated fields.
        db: The database session dependency.

    Returns:
        The updated version object.

    Raises:
        HTTPException: If the version is not found (Status 404) or if a database
            integrity error occurs during the update (Status 400).
    """
    db_version = version_crud.get_version_by_id(session=db, version_id=version_id)
    if not db_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Version not found."
        )

    try:
        return version_crud.update_version(
            session=db, db_version=db_version, version_in=version_in
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error during update.",
        )


@router.delete("/{version_id}", response_model=dict[str, str])
def delete_version(version_id: int, db: Session = Depends(get_db)):
    """Deletes a Version by its ID.

    Attempts to remove the version from the database. If there are dependent
    records (like Sets of Equipment or Vehicles) that prevent deletion, an
    HTTP conflict error is raised.

    Args:
        version_id: The primary key of the version to delete.
        db: The database session dependency.

    Returns:
        A dictionary containing a success message.

    Raises:
        HTTPException: If the version is not found (Status 404) or if deletion
            fails due to foreign key constraints (Status 409).
    """
    db_version = version_crud.get_version_by_id(session=db, version_id=version_id)
    if not db_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Version not found."
        )

    try:
        version_crud.delete_version(session=db, db_version=db_version)
        return {"message": "Version has been deleted successfully."}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete this Version because there are Sets of Equipment or Vehicles associated with it.",
        )
