from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict
from database.database import Base

from models.vehmodel_model import VehModel
from models.version_model import Version

if TYPE_CHECKING:
    from models.caretaker_model import Caretaker


class Vehicle(Base):
    """Class representing the Vehicle table. Now linked to Caretaker instead of Worker."""
    __tablename__ = "vehicle"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    veh_model_id: Mapped[int] = mapped_column(ForeignKey("vehmodel.id", ondelete="RESTRICT"), nullable=False)
    version_id: Mapped[int] = mapped_column(ForeignKey("version.id", ondelete="RESTRICT"), nullable=False)

    # Klucz obcy do Caretakers (Relacja 1:1)
    # unique=True zapewnia, że jeden Caretaker nie zostanie przypisany do dwóch aut
    caretaker_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("caretaker.id", ondelete="SET NULL"),
        nullable=True,
        unique=True
    )

    # Nowe pole state
    state: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    veh_model: Mapped["VehModel"] = relationship(back_populates="vehicles")
    version: Mapped["Version"] = relationship(back_populates="vehicles")
    caretaker: Mapped["Caretaker"] = relationship(back_populates="vehicle")


class VehicleBase(BaseModel):
    veh_model_id: int
    version_id: int
    caretaker_id: Optional[int] = None
    state: Optional[str] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    veh_model_id: Optional[int] = None
    version_id: Optional[int] = None
    caretaker_id: Optional[int] = None
    state: Optional[str] = None  # Umożliwia update pola state


class VehiclePublic(VehicleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class VehiclesPublic(BaseModel):
    data: list[VehiclePublic]
    count: int