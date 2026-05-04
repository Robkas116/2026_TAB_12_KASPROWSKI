from typing import TYPE_CHECKING

from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pydantic import BaseModel, ConfigDict, Field, EmailStr
from database.database import Base

if TYPE_CHECKING:
    from models.caretaker_model import Caretaker
    from models.reservation_model import Reservation


class Worker(Base):
    """Class representing the Worker table."""

    __tablename__ = "worker"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    caretakers: Mapped[list["Caretaker"]] = relationship(back_populates="worker")
    reservations: Mapped[list["Reservation"]] = relationship(back_populates="worker")


class WorkerBase(BaseModel):
    name: str = Field(max_length=100)
    email: EmailStr = Field(max_length=120)


class WorkerCreate(WorkerBase):
    pass


class WorkerUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = Field(default=None, max_length=120)


class WorkerPublic(WorkerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class WorkersPublic(BaseModel):
    data: list[WorkerPublic]
    count: int
