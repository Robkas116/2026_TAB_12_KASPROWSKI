from enum import StrEnum
from typing import Optional
from datetime import datetime
from sqlalchemy import Integer, Float, DateTime, String, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict, field_validator
from database.database import Base


from models.vehicle_model import Vehicle
from models.worker_model import Worker
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.is_performed_model import IsPerformed


class Purpose_enum(StrEnum):
    """Enum class for reservation purposes, defining possible values."""

    BUSINESS = "business"
    PRIVATE = "private"
    SERVICE = "service"


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
    date_start_planned: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    date_end_planned: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    distance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    purpose: Mapped[Purpose_enum] = mapped_column(
        Enum(Purpose_enum, native_enum=False), 
        nullable=False
    )
    date_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    date_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    state: Mapped[Reservation_state_enum] = mapped_column(
        Enum(Reservation_state_enum, native_enum=False),
        default=Reservation_state_enum.CREATED, 
        nullable=False
    )

    state_start: Mapped[Optional[str]] = mapped_column(String(350), nullable=True)
    state_end: Mapped[Optional[str]] = mapped_column(String(350), nullable=True)
    service_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicle.id", ondelete="RESTRICT"), nullable=False)
    worker_id: Mapped[int] = mapped_column(
        ForeignKey("worker.id", ondelete="RESTRICT"), nullable=False
    )

    vehicle: Mapped["Vehicle"] = relationship(back_populates="reservations")
    worker: Mapped["Worker"] = relationship(back_populates="reservations")
    # Relationship to IsPerformed
    is_performeds: Mapped[list["IsPerformed"]] = relationship("IsPerformed", back_populates="reservation", cascade="all, delete-orphan")


class ReservationBase(BaseModel):
    """Base class for Reservation, containing common fields."""

    date_start_planned: datetime
    date_end_planned: datetime
    price: float
    purpose: Purpose_enum
    vehicle_id: int
    worker_id: int
    service_name: Optional[str] = None


class ReservationCreate(ReservationBase):
    """Class with all fields required for creation,
    it inherits from base with all reservation details,
     id is generated in the database"""

    pass


class ReservationUpdate(BaseModel):
    """Class with all fields optional for update operations"""

    date_start_planned: Optional[datetime] = None
    date_end_planned: Optional[datetime] = None
    purpose: Optional[Purpose_enum] = None
    date_start: Optional[datetime] = None
    date_end: Optional[datetime] = None
    price: Optional[float] = None
    distance: Optional[float] = None
    state: Optional[Reservation_state_enum] = None
    state_start: Optional[str] = None
    state_end: Optional[str] = None
    service_name: Optional[str] = None

    @field_validator("date_start", "date_end", "date_start_planned", "date_end_planned")
    @classmethod
    def truncate_seconds(cls, value: datetime) -> datetime:
        if value:
            return value.replace(second=0, microsecond=0)
        return value


class ReservationPublic(ReservationBase):
    """Class with properties to return, includes id from database"""

    id: int
    distance: Optional[float]
    date_start: Optional[datetime]
    date_end: Optional[datetime]
    state: Reservation_state_enum
    state_start: Optional[str]
    state_end: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class ReservationsPublic(BaseModel):
    """Class for returning a list of reservations with a count"""

    data: list[ReservationPublic]
    count: int
