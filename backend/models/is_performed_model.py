from datetime import date as dt_date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Integer, Date, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pydantic import BaseModel, ConfigDict, Field, model_validator
from enum import StrEnum
from database.database import Base

if TYPE_CHECKING:
    from models.action_model import Action
    from models.reservation_model import Reservation


class State(StrEnum):
    AWAITING = "awaiting"
    PERFORMED = "performed"
    COMPLETED = "completed"


class IsPerformed(Base):
    """Class representing the is_performed table in the database"""

    __tablename__ = "is_performed"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[dt_date] = mapped_column(Date, nullable=False)
    state: Mapped[State] = mapped_column(Enum(State), nullable=False)
    action_id: Mapped[int] = mapped_column(Integer, ForeignKey("action.id", ondelete="RESTRICT"), nullable=False)
    reservation_id: Mapped[int] = mapped_column(Integer, ForeignKey("reservation.id", ondelete="RESTRICT"), nullable=False)

    # Relationship to Action
    action: Mapped["Action"] = relationship("Action", back_populates="is_performeds")
    # Relationship to Reservation
    reservation: Mapped["Reservation"] = relationship("Reservation", back_populates="is_performeds")


class IsPerformedBase(BaseModel):
    """Class with common fields for IsPerformed, used as a base for other schemas"""

    price: int = Field(ge=0)
    date: dt_date
    state: State


class IsPerformedCreate(IsPerformedBase):
    """
    Class with all fields required for creation,
    it inherits from base with price, date and state,
    id is generated in the database
    """

    action_id: int = Field(gt=0)
    reservation_id: int = Field(gt=0)


class IsPerformedUpdate(IsPerformedBase):
    """Class with all fields optional for update operations"""

    price: int | None = Field(default=None, ge=0)
    date: dt_date | None = Field(default=None)
    state: State | None = Field(default=None)
    action_id: int | None = Field(default=None, gt=0)
    reservation_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="before")
    @classmethod
    def reject_explicit_nulls(cls, data):
        if not isinstance(data, dict):
            return data

        null_fields = [
            field
            for field in ("price", "date", "state", "action_id", "reservation_id")
            if data.get(field) is None and field in data
        ]
        if null_fields:
            fields = ", ".join(null_fields)
            raise ValueError(f"Null is not allowed for fields: {fields}.")

        return data


class IsPerformedPublic(IsPerformedBase):
    """Class with properties to return, includes id from database"""

    id: int
    action_id: int
    reservation_id: int
    # Translate db object to JSON using attribute names
    model_config = ConfigDict(from_attributes=True)


class IsPerformedsPublic(BaseModel):
    """Class for returning a list of is_performeds with a count"""

    data: list[IsPerformedPublic]
    count: int
