from sqlalchemy import Enum, String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from pydantic import BaseModel, ConfigDict, Field
from enum import StrEnum
from database.database import Base


class ActionType(StrEnum):
    SERVICE = "service"
    EXPLOITATION = "exploitation"


class Action(Base):
    """Class representing the Action table in the database"""

    __tablename__ = "action"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[ActionType] = mapped_column(Enum(ActionType), nullable=False)


class ActionBase(BaseModel):
    """Class with common fields for Action, used as a base for other schemas"""

    name: str = Field(max_length=100)


class ActionCreate(ActionBase):
    """
    Class with all fields required for creation,
    it inherits from base with name and email,
    id is generated in the database
    """

    type: ActionType = Field(default=None, max_length=50)


class ActionUpdate(ActionBase):
    """Class with all fields optional for update operations"""

    name: str | None = Field(default=None, max_length=100)
    type: ActionType | None = Field(default=None, max_length=50)


class ActionPublic(ActionBase):
    """Class with properties to return, includes id from database"""

    id: int
    type: ActionType
    # Translate db object to JSON using attribute names
    model_config = ConfigDict(from_attributes=True)


class ActionsPublic(BaseModel):
    """Class for returning a list of actions with a count"""

    data: list[ActionPublic]
    count: int
