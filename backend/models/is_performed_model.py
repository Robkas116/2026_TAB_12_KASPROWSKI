from datetime import date as dt_date

from sqlalchemy import Integer, Date, Enum
from sqlalchemy.orm import Mapped, mapped_column

from pydantic import BaseModel, ConfigDict, Field, model_validator
from enum import StrEnum
from database.database import Base


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

    pass


class IsPerformedUpdate(IsPerformedBase):
    """Class with all fields optional for update operations"""

    price: int | None = Field(default=None, ge=0)
    date: dt_date | None = Field(default=None)
    state: State | None = Field(default=None)

    @model_validator(mode="before")
    @classmethod
    def reject_explicit_nulls(cls, data):
        if not isinstance(data, dict):
            return data

        null_fields = [
            field
            for field in ("price", "date", "state")
            if data.get(field) is None and field in data
        ]
        if null_fields:
            fields = ", ".join(null_fields)
            raise ValueError(f"Null is not allowed for fields: {fields}.")

        return data


class IsPerformedPublic(IsPerformedBase):
    """Class with properties to return, includes id from database"""

    id: int
    # Translate db object to JSON using attribute names
    model_config = ConfigDict(from_attributes=True)


class IsPerformedsPublic(BaseModel):
    """Class for returning a list of is_performeds with a count"""

    data: list[IsPerformedPublic]
    count: int
