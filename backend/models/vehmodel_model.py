from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pydantic import BaseModel, ConfigDict, Field

from models.make_model import Make
from database.database import Base

if TYPE_CHECKING:
    from models.vehicle_model import Vehicle


class VehModel(Base):
    """Class representing the Vehicle Model table in the database"""

    __tablename__ = "vehmodel"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    make_id: Mapped[int] = mapped_column(
        ForeignKey("make.id", ondelete="RESTRICT"), nullable=False
    )

    make: Mapped["Make"] = relationship(back_populates="models")
    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="veh_model")


class VehModelBase(BaseModel):
    """Class with common fields for Vehicle Model, used as a base for other schemas"""

    name: str = Field(max_length=100)
    make_id: int = Field(description="ID of the associated Make")


class VehModelCreate(VehModelBase):
    """
    Class with all fields required for creation,
    it inherits from base with name and email,
    id is generated in the database
    """

    pass


class VehModelUpdate(VehModelBase):
    """Class with all fields optional for update operations"""

    name: str | None = Field(default=None, max_length=100)
    make_id: int | None = Field(default=None)


class VehModelPublic(VehModelBase):
    """Class with properties to return, includes id from database"""

    id: int
    model_config = ConfigDict(from_attributes=True)


class VehModelsPublic(BaseModel):
    """Class for returning a list of models with a count"""

    data: list[VehModelPublic]
    count: int
