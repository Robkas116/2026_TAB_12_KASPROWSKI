from typing import TYPE_CHECKING, Optional
from datetime import date
from sqlalchemy import ForeignKey, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict, Field

from database.database import Base

if TYPE_CHECKING:
    from models.worker_model import Worker
    from models.vehicle_model import Vehicle


class Caretaker(Base):
    __tablename__ = "caretaker"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Relacja N:1 z Worker
    worker_id: Mapped[int] = mapped_column(ForeignKey("worker.id", ondelete="RESTRICT"), nullable=False)
    worker: Mapped["Worker"] = relationship(back_populates="caretakers")

    # Nowe pola daty
    date_start: Mapped[date] = mapped_column(Date, nullable=False)
    date_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relacja 1:1 z Vehicle
    vehicle: Mapped["Vehicle"] = relationship(back_populates="caretaker")


# Schematy Pydantic

class CaretakerBase(BaseModel):
    worker_id: int
    date_start: date = Field(description="Start Date (YYYY-MM-DD)")


class CaretakerCreate(CaretakerBase):
    pass


class CaretakerUpdate(BaseModel):
    worker_id: Optional[int] = None
    date_start: Optional[date] = None
    date_end: Optional[date] = None


class CaretakerPublic(CaretakerBase):
    id: int
    date_end: Optional[date] = None
    model_config = ConfigDict(from_attributes=True)