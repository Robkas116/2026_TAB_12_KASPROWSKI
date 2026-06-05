from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from crud import reservation_crud
from database.database import get_db
from models.reservation_model import (
    ReservationCreate,
    ReservationPublic,
    ReservationUpdate,
    ReservationsPublic,
)

router = APIRouter(prefix="/reservation", tags=["Reservations"])


@router.post("/", response_model=ReservationPublic, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation_in: ReservationCreate, db: Session = Depends(get_db)
):
    """Creates a new Reservation in the database.

    Args:
        reservation_in: The validated Pydantic schema with data for the new reservation.
        db: The database session dependency.

    Returns:
        The newly created reservation object.

    Raises:
        HTTPException: If a database integrity constraint fails, such as providing
            non-existent vehicle_id or worker_id (Status 400).
    """
    # try:
    return reservation_crud.create_reservation(
        session=db, reservation_in=reservation_in
    )
    # except IntegrityError:
    #     db.rollback()
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Database integrity error. Ensure the provided vehicle_id and worker_id exist.",
    #     )


@router.get("/", response_model=ReservationsPublic)
def get_reservations(
    db: Session = Depends(get_db),
    skip: int = Query(0, description="Number of items to skip (offset)"),
    limit: int = Query(100, le=1000, description="Max number of items to return"),
    worker_id: int | None = Query(None, description="Filter reservations by worker ID"),
):
    """Retrieves all Reservations with optional pagination and filtering.

    Args:
        db: The database session dependency.
        skip: Number of records to skip (offset).
        limit: Maximum number of records to return.
        worker_id: Filter by worker ID.

    Returns:
        A list of reservations along with the total count.
    """
    return reservation_crud.get_all_reservations(
        session=db, skip=skip, limit=limit, worker_id=worker_id
    )


@router.get("/{reservation_id}", response_model=ReservationPublic)
def get_reservation_by_id(reservation_id: int, db: Session = Depends(get_db)):
    """Retrieves a Reservation by its ID.

    Args:
        reservation_id: The ID of the reservation to retrieve.
        db: The database session dependency.

    Returns:
        The reservation object if found.

    Raises:
        HTTPException: If the reservation with the given ID is not found (Status 404).
    """
    reservation = reservation_crud.get_reservation_by_id(
        session=db, reservation_id=reservation_id
    )
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation with ID {reservation_id} not found.",
        )
    return reservation


@router.patch("/{reservation_id}", response_model=ReservationPublic)
def update_reservation(
    reservation_id: int,
    reservation_in: ReservationUpdate,
    db: Session = Depends(get_db),
):
    """Updates an existing Reservation.

    Args:
        reservation_id: The ID of the reservation to update.
        reservation_in: The validated Pydantic schema with data for updating the reservation.
        db: The database session dependency.

    Returns:
        The updated reservation object if found and updated, otherwise raises HTTPException.

    Raises:
        HTTPException: If the reservation with the given ID is not found (Status 404).
    """
    updated_reservation = reservation_crud.update_reservation(
        session=db, reservation_id=reservation_id, reservation_in=reservation_in
    )
    if not updated_reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation with ID {reservation_id} not found.",
        )
    return updated_reservation


@router.delete("/{reservation_id}", response_model=dict[str, str])
def delete_reservation(reservation_id: int, db: Session = Depends(get_db)):
    """Deletes a Reservation by its ID.

    Args:
        reservation_id: The ID of the reservation to delete.
        db: The database session dependency.

    Returns:
        A dictionary with a success message.

    Raises:
        HTTPException: If the reservation with the given ID is not found (Status 404).
    """
    reservation = reservation_crud.get_reservation_by_id(
        session=db, reservation_id=reservation_id
    )
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation with ID {reservation_id} not found.",
        )

    reservation_crud.delete_reservation(session=db, db_reservation=reservation)
    return {"message": "reservation deleted succesfully"}
