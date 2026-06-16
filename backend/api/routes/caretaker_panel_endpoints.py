from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from api import deps
from crud import caretaker_crud, reservation_crud, worker_crud, is_performed_crud
from database.database import get_db
from models.caretaker_model import (
    VehicleWithMake,
    VehiclesWithMakePublic,
    PanelReservationPublic,
    PanelReservationsPublic,
    PanelExploitationPublic,
    PanelExploitationsPublic,
)
from models.reservation_model import (
    ReservationCreate,
    ReservationUpdate,
    ReservationPublic,
    Purpose_enum,
    Reservation_state_enum,
)
from models.is_performed_model import IsPerformedUpdate, IsPerformedPublic, State
from models.worker_model import Worker

router = APIRouter(prefix="/caretaker-panel", tags=["Caretaker Panel"])


# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------

@router.get("/vehicles", response_model=VehiclesWithMakePublic)
def get_my_vehicles(
    db: Session = Depends(get_db),
    current_user: Worker = Depends(deps.get_current_user),
):
    """List all vehicles where the current user is an active caretaker."""
    rows = caretaker_crud.get_caretaker_vehicles(
        session=db, worker_id=current_user.id
    )
    data = [
        VehicleWithMake(
            id=r[0].id,
            description=r[0].description,
            make_name=r[1],
            model_name=r[2],
            version_name=r[3],
        )
        for r in rows
    ]
    return VehiclesWithMakePublic(data=data, count=len(data))


# ---------------------------------------------------------------------------
# Reservations (all, for the vehicle)
# ---------------------------------------------------------------------------

@router.get(
    "/vehicles/{vehicle_id}/reservations",
    response_model=PanelReservationsPublic,
)
def get_vehicle_reservations(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: Worker = Depends(deps.get_current_user),
    skip: int = Query(0),
    limit: int = Query(100, le=1000),
):
    """Get all reservations for a vehicle the caretaker manages."""
    deps.verify_caretaker_of_vehicle(vehicle_id, current_user, db)

    # Auto-transition reservation states + complete expired services
    reservation_crud.auto_transition_reservations(session=db)
    reservation_crud.auto_complete_services(session=db)

    result = reservation_crud.get_reservations_for_vehicle(
        session=db, vehicle_id=vehicle_id, skip=skip, limit=limit
    )

    enriched = []
    for r in result.data:
        w = worker_crud.get_worker_by_id(session=db, worker_id=r.worker_id)
        enriched.append(
            PanelReservationPublic(
                id=r.id,
                date_start_planned=r.date_start_planned,
                date_end_planned=r.date_end_planned,
                price=r.price,
                distance=r.distance,
                purpose=r.purpose,
                date_start=r.date_start,
                date_end=r.date_end,
                state=r.state,
                state_start=r.state_start,
                state_end=r.state_end,
                service_name=getattr(r, "service_name", None),
                vehicle_id=r.vehicle_id,
                worker_id=r.worker_id,
                worker_name=w.name if w else "Nieznany",
            )
        )

    return PanelReservationsPublic(data=enriched, count=result.count)


# ---------------------------------------------------------------------------
# Cancel (reject) a reservation
# ---------------------------------------------------------------------------

@router.post(
    "/vehicles/{vehicle_id}/reservations/{reservation_id}/cancel",
    response_model=ReservationPublic,
)
def cancel_reservation(
    vehicle_id: int,
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: Worker = Depends(deps.get_current_user),
):
    """Cancel (reject) any reservation on the caretaker's vehicle."""
    deps.verify_caretaker_of_vehicle(vehicle_id, current_user, db)

    db_res = reservation_crud.get_reservation_by_id(
        session=db, reservation_id=reservation_id
    )
    if not db_res or db_res.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rezerwacja nie znaleziona.",
        )

    if db_res.state == Reservation_state_enum.CANCELED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rezerwacja jest już anulowana.",
        )

    updated = reservation_crud.update_reservation(
        session=db,
        reservation_id=reservation_id,
        reservation_in=ReservationUpdate(state=Reservation_state_enum.CANCELED),
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rezerwacja nie znaleziona.",
        )
    return updated


# ---------------------------------------------------------------------------
# Service reservations (purpose = "service")
# ---------------------------------------------------------------------------

@router.post(
    "/vehicles/{vehicle_id}/service",
    response_model=ReservationPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_service_reservation(
    vehicle_id: int,
    reservation_in: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: Worker = Depends(deps.get_current_user),
):
    """Create a service reservation for the vehicle."""
    deps.verify_caretaker_of_vehicle(vehicle_id, current_user, db)

    if reservation_in.purpose != Purpose_enum.SERVICE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cel rezerwacji musi być 'service'.",
        )

    # Force vehicle_id and worker_id from context
    reservation_in.vehicle_id = vehicle_id
    reservation_in.worker_id = current_user.id

    try:
        return reservation_crud.create_reservation(
            session=db, reservation_in=reservation_in
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.patch(
    "/vehicles/{vehicle_id}/service/{reservation_id}",
    response_model=ReservationPublic,
)
def edit_service_reservation(
    vehicle_id: int,
    reservation_id: int,
    reservation_in: ReservationUpdate,
    db: Session = Depends(get_db),
    current_user: Worker = Depends(deps.get_current_user),
):
    """Edit a service reservation."""
    deps.verify_caretaker_of_vehicle(vehicle_id, current_user, db)

    db_res = reservation_crud.get_reservation_by_id(
        session=db, reservation_id=reservation_id
    )
    if (
        not db_res
        or db_res.vehicle_id != vehicle_id
        or db_res.purpose != Purpose_enum.SERVICE
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rezerwacja serwisowa nie znaleziona.",
        )

    try:
        updated = reservation_crud.update_reservation(
            session=db,
            reservation_id=reservation_id,
            reservation_in=reservation_in,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rezerwacja nie znaleziona.",
        )
    return updated


# ---------------------------------------------------------------------------
# Exploitations
# ---------------------------------------------------------------------------

@router.get(
    "/vehicles/{vehicle_id}/exploitations",
    response_model=PanelExploitationsPublic,
)
def get_exploitations(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: Worker = Depends(deps.get_current_user),
    skip: int = Query(0),
    limit: int = Query(100, le=1000),
):
    """Get all exploitation requests for the caretaker's vehicle."""
    deps.verify_caretaker_of_vehicle(vehicle_id, current_user, db)

    rows = reservation_crud.get_exploitations_for_vehicle(
        session=db, vehicle_id=vehicle_id, skip=skip, limit=limit
    )

    data = [
        PanelExploitationPublic(
            id=r[0].id,
            price=r[0].price,
            date=r[0].date,
            state=r[0].state,
            action_id=r[0].action_id,
            action_name=r[1],
            reservation_id=r[0].reservation_id,
            reservation_start=r[2],
            reservation_end=r[3],
            worker_name=r[4],
        )
        for r in rows
    ]
    return PanelExploitationsPublic(data=data, count=len(data))


@router.patch(
    "/vehicles/{vehicle_id}/exploitations/{is_performed_id}",
    response_model=IsPerformedPublic,
)
def update_exploitation_status(
    vehicle_id: int,
    is_performed_id: int,
    update_in: IsPerformedUpdate,
    db: Session = Depends(get_db),
    current_user: Worker = Depends(deps.get_current_user),
):
    """Mark an exploitation request as performed or completed."""
    deps.verify_caretaker_of_vehicle(vehicle_id, current_user, db)

    db_ip = is_performed_crud.get_is_performed_by_id(
        session=db, is_performed_id=is_performed_id
    )
    if not db_ip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rekord eksploatacji nie znaleziony.",
        )

    # Verify the associated reservation belongs to this vehicle
    db_res = reservation_crud.get_reservation_by_id(
        session=db, reservation_id=db_ip.reservation_id
    )
    if not db_res or db_res.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak dostępu do tego rekordu eksploatacji.",
        )

    try:
        return is_performed_crud.update_is_performed(
            session=db,
            db_is_performed=db_ip,
            is_performed_in=update_in,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
