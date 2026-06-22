from typing import Optional
from datetime import date, datetime
from sqlalchemy import ForeignKey, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict, Field, field_validator

from database.database import Base


from models.worker_model import Worker
from models.vehicle_model import Vehicle
from models.reservation_model import Purpose_enum, Reservation_state_enum
from models.is_performed_model import State


class Caretaker(Base):
    """Class representing the Caretaker table in the database."""

    __tablename__ = "caretaker"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    worker_id: Mapped[int] = mapped_column(
        ForeignKey("worker.id", ondelete="RESTRICT"), nullable=False
    )

    date_start: Mapped[date] = mapped_column(Date, nullable=False)
    date_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True, default=None)

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicle.id", ondelete="RESTRICT"), nullable=False
    )

    vehicle: Mapped["Vehicle"] = relationship(back_populates="caretakers")
    worker: Mapped["Worker"] = relationship(back_populates="caretakers")


class CaretakerBase(BaseModel):
    worker_id: int
    date_start: date = Field(description="Start Date (YYYY-MM-DD)")
    vehicle_id: int


class CaretakerCreate(CaretakerBase):
    date_end: Optional[date] = None

    @field_validator("date_start", "date_end", mode="before")
    @classmethod
    def normalize_date_fields(cls, value: Optional[date | datetime]) -> Optional[date]:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, str):
            return value.split("T")[0].split(" ")[0]  
        return value


class CaretakerUpdate(BaseModel):
    worker_id: Optional[int] = None
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    vehicle_id: Optional[int] = None

    @field_validator("date_start", "date_end", mode="before")
    @classmethod
    def normalize_date_fields(cls, value: Optional[date | datetime]) -> Optional[date]:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.date()
        return value


class CaretakerPublic(CaretakerBase):
    id: int
    date_end: Optional[date] = None
    model_config = ConfigDict(from_attributes=True)


class CaretakersPublic(BaseModel):
    data: list[CaretakerPublic]
    count: int


# --- Caretaker Panel response models ---

class VehicleWithMake(BaseModel):
    id: int
    description: Optional[str] = None
    make_name: str
    model_name: str
    version_name: str
    model_config = ConfigDict(from_attributes=True)


class VehiclesWithMakePublic(BaseModel):
    data: list[VehicleWithMake]
    count: int


class PanelReservationPublic(BaseModel):
    """Reservation with worker name for caretaker display."""
    id: int
    date_start_planned: datetime
    date_end_planned: datetime
    price: float
    distance: Optional[float] = None
    purpose: Purpose_enum
    date_start: Optional[datetime] = None
    date_end: Optional[datetime] = None
    state: Reservation_state_enum
    state_start: Optional[str] = None
    state_end: Optional[str] = None
    service_name: Optional[str] = None
    vehicle_id: int
    worker_id: int
    worker_name: str
    is_performed_state: Optional[State] = None
    is_performed_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class PanelReservationsPublic(BaseModel):
    data: list[PanelReservationPublic]
    count: int


class PanelExploitationPublic(BaseModel):
    id: int
    price: int
    date: date
    state: State
    action_id: int
    action_name: str
    reservation_id: int
    reservation_start: datetime
    reservation_end: datetime
    worker_name: str
    model_config = ConfigDict(from_attributes=True)


class PanelExploitationsPublic(BaseModel):
    data: list[PanelExploitationPublic]
    count: int
