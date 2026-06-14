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
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(default=False, nullable=False)
    onboarding_completed: Mapped[bool] = mapped_column(default=False, nullable=False)

    caretakers: Mapped[list["Caretaker"]] = relationship(back_populates="worker")
    reservations: Mapped[list["Reservation"]] = relationship(back_populates="worker")


class WorkerBase(BaseModel):
    name: str = Field(max_length=100)
    email: str = Field(max_length=120)
    is_superuser: bool = False


class WorkerCreate(WorkerBase):
    password: str = Field(min_length=6)


class WorkerUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=120)
    password: str | None = Field(default=None, min_length=6)
    is_superuser: bool | None = None
    onboarding_completed: bool | None = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetRequestResponse(BaseModel):
    message: str
    reset_link: str | None = None


class PasswordResetConfirm(BaseModel):
    token: str
    password: str = Field(min_length=6)


class PasswordChange(BaseModel):
    old_password: str = Field(min_length=6)
    new_password: str = Field(min_length=6)


class WorkerPublic(WorkerBase):
    id: int
    onboarding_completed: bool = False
    model_config = ConfigDict(from_attributes=True)


class WorkersPublic(BaseModel):
    data: list[WorkerPublic]
    count: int
