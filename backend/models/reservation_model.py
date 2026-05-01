from enum import StrEnum
from typing import Optional
from datetime import datetime
from sqlalchemy import Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict, field_validator
from database.database import Base


#  from models.vehicle_model import Vehicle
from models.worker_model import Worker


class Purpose_enum(StrEnum):
    """Enum class for reservation purposes, defining possible values."""

    BUSINESS = "business"
    PRIVATE = "private"


class Reservation_state_enum(StrEnum):
    """Enum class for reservation states, defining possible values."""

    CREATED = "created"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"


class Reservation(Base):
    """Class representing the Reservation table in the database, with relationships to Vehicle and Worker."""

    __tablename__ = "reservation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    date_start_planned: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    date_end_planned: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    distance: Mapped[float] = mapped_column(Float)
    purpose: Mapped[Purpose_enum] = mapped_column(nullable=False)
    date_start: Mapped[datetime] = mapped_column(DateTime)
    date_end: Mapped[datetime] = mapped_column(DateTime)
    state: Mapped[Reservation_state_enum] = mapped_column(
        default=Reservation_state_enum.CREATED, nullable=False
    )

    state_start: Mapped[str] = mapped_column(String(350))
    state_end: Mapped[str] = mapped_column(String(350))

    # vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicle.id", ondelete="RESTRICT"), nullable=False)
    worker_id: Mapped[int] = mapped_column(
        ForeignKey("worker.id", ondelete="RESTRICT"), nullable=False
    )

    # vehicle: Mapped["Vehicle"] = relationship(back_populates="reservations")
    worker: Mapped["Worker"] = relationship(back_populates="reservations")


class ReservationBase(BaseModel):
    """Base class for Reservation, containing common fields."""

    date_start_planned: datetime
    date_end_planned: datetime
    price: float
    purpose: Purpose_enum
    # vehicle_id: int
    worker_id: int


class ReservationCreate(ReservationBase):
    """Class with all fields required for creation,
    it inherits from base with all reservation details,
     id is generated in the database"""

    pass


class ReservationUpdate(BaseModel):
    """Class with all fields optional for update operations"""

    date_start: Optional[datetime] = None
    date_end: Optional[datetime] = None
    price: Optional[float] = None
    distance: Optional[float] = None
    state: Optional[Reservation_state_enum] = None
    state_start: Optional[str] = None
    state_end: Optional[str] = None

    @field_validator("date_start", "date_end")
    @classmethod
    def truncate_seconds(cls, value: datetime) -> datetime:

        if value:
            return value.replace(second=0, microsecond=0)
        return value


class ReservationPublic(ReservationBase):
    """Class with properties to return, includes id from database"""

    id: int
    distance: float
    date_start: datetime
    date_end: datetime
    state: Reservation_state_enum
    state_start: str
    state_end: str

    model_config = ConfigDict(from_attributes=True)


class ReservationsPublic(BaseModel):
    """Class for returning a list of reservations with a count"""

    data: list[ReservationPublic]
    count: int
