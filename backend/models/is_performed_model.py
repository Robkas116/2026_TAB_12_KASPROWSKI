from datetime import date

from sqlalchemy import Integer, Date, Enum
from sqlalchemy.orm import Mapped, mapped_column

from pydantic import BaseModel, ConfigDict, Field
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
    date: Mapped[date] = mapped_column(Date, nullable=False)
    state: Mapped[State] = mapped_column(Enum(State), nullable=False)


class IsPerformedBase(BaseModel):
    """Class with common fields for IsPerformed, used as a base for other schemas"""

    price: int = Field(ge=0)
    date: date
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
    date: date | None = Field(default=None)
    state: State | None = Field(default=None)


class IsPerformedPublic(IsPerformedBase):
    """Class with properties to return, includes id from database"""

    id: int
    # Translate db object to JSON using attribute names
    model_config = ConfigDict(from_attributes=True)


class IsPerformedsPublic(BaseModel):
    """Class for returning a list of is_performeds with a count"""

    data: list[IsPerformedPublic]
    count: int
