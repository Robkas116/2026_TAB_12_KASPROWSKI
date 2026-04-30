from typing import TYPE_CHECKING, Optional
from datetime import datetime
from sqlalchemy import Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict
from database.database import Base

if TYPE_CHECKING:
    from models.vehicle_model import Vehicle
    from models.worker_model import Worker

class Reservation(Base):
    """Class representing the Reservation table in the database, with relationships to Vehicle and Worker."""
    __tablename__ = "reservation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    date_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    date_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    distance: Mapped[float] = mapped_column(Float, nullable=False)
    purpose: Mapped[str] = mapped_column(String(255), nullable=False)
    length: Mapped[float] = mapped_column(Float, nullable=False)
    state: Mapped[str] = mapped_column(String(50), nullable=False)

    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicle.id", ondelete="RESTRICT"), nullable=False)
    worker_id: Mapped[int] = mapped_column(ForeignKey("worker.id", ondelete="RESTRICT"), nullable=False)

    vehicle: Mapped["Vehicle"] = relationship()
    worker: Mapped["Worker"] = relationship()

class ReservationBase(BaseModel):
    """Base class for Reservation, containing common fields."""
    date_start: datetime
    date_end: datetime
    price: float
    distance: float
    purpose: str
    length: float
    state: str
    vehicle_id: int
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
    purpose: Optional[str] = None
    length: Optional[float] = None
    state: Optional[str] = None
    vehicle_id: Optional[int] = None
    worker_id: Optional[int] = None

class ReservationPublic(ReservationBase):
    """Class with properties to return, includes id from database"""
    id: int
    model_config = ConfigDict(from_attributes=True)
class ReservationsPublic(BaseModel):
    """Class for returning a list of reservations with a count"""
    data: list[ReservationPublic]
    count: int
    