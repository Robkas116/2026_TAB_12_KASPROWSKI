from typing import Optional
from datetime import date
from sqlalchemy import ForeignKey, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict, Field

from database.database import Base


from models.worker_model import Worker
from models.vehicle_model import Vehicle


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
    pass


class CaretakerUpdate(BaseModel):
    worker_id: Optional[int] = None
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    vehicle_id: Optional[int] = None


class CaretakerPublic(CaretakerBase):
    id: int
    date_end: Optional[date] = None
    model_config = ConfigDict(from_attributes=True)


class CaretakersPublic(BaseModel):
    data: list[CaretakerPublic]
    count: int
