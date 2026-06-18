from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict
from database.database import Base

from models.vehmodel_model import VehModel
from models.version_model import Version

if TYPE_CHECKING:
    from models.caretaker_model import Caretaker
    from models.reservation_model import Reservation


class Vehicle(Base):
    """Class representing the Vehicle table."""

    __tablename__ = "vehicle"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    veh_model_id: Mapped[int] = mapped_column(
        ForeignKey("vehmodel.id", ondelete="RESTRICT"), nullable=False
    )
    version_id: Mapped[int] = mapped_column(
        ForeignKey("version.id", ondelete="RESTRICT"), nullable=False
    )

    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    veh_model: Mapped["VehModel"] = relationship(back_populates="vehicles")
    version: Mapped["Version"] = relationship(back_populates="vehicles")
    caretakers: Mapped[list["Caretaker"]] = relationship(back_populates="vehicle")
    reservations: Mapped[list["Reservation"]] = relationship(back_populates="vehicle")


class VehicleBase(BaseModel):
    veh_model_id: int
    version_id: int
    description: Optional[str] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    veh_model_id: Optional[int] = None
    version_id: Optional[int] = None
    description: Optional[str] = None


class VehiclePublic(VehicleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class VehiclesPublic(BaseModel):
    data: list[VehiclePublic]
    count: int
