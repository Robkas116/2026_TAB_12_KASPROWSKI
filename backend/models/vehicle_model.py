from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict, Field
from database.database import Base

if TYPE_CHECKING:
    from models.vehmodel_model import VehModel
    from models.version_model import Version

class Vehicle(Base):
    """Class representing the Vehicle table in the database, with relationships to VehModel and Version."""
    __tablename__ = "vehicle"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vin: Mapped[str] = mapped_column(String(17), unique=True, nullable=False, index=True)
    registration_number: Mapped[str] = mapped_column(String(15), unique=True, nullable=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relacja do konkretnego modelu (np. Toyota Corolla)
    veh_model_id: Mapped[int] = mapped_column(ForeignKey("vehmodel.id", ondelete="RESTRICT"), nullable=False)
    veh_model: Mapped["VehModel"] = relationship()

    # Relacja do wersji/wyposażenia
    version_id: Mapped[int] = mapped_column(ForeignKey("version.id", ondelete="RESTRICT"), nullable=False)
    version: Mapped["Version"] = relationship()

    class VehicleBase(BaseModel):
        """Base class for Vehicle, containing common fields."""
        vin: str = Field(..., max_length=17, min_length=17)
        registration_number: Optional[str] = Field(None, max_length=15)
        year: int
        veh_model_id: int
        version_id: int
    class VehicleCreate(VehicleBase):
        """Class with all fields required for creation,
          it inherits from base with vin, registration_number, year, 
          veh_model_id and version_id, id is generated in the database"""
        pass
    class VehicleUpdate(BaseModel):
        """Class with all fields optional for update operations"""
        vin: Optional[str] = Field(None, max_length=17, min_length=17)
        registration_number: Optional[str] = Field(None, max_length=15)
        year: Optional[int] = None
        veh_model_id: Optional[int] = None
        version_id: Optional[int] = None
    class VehiclePublic(VehicleBase):
        """Class with properties to return, includes id from database"""
        id: int
        # Translate db object to JSON using attribute names
        model_config = ConfigDict(from_attributes=True)
    class VehiclesPublic(BaseModel):
        """Class for returning a list of vehicles with a count"""
        data: list[VehiclePublic]
        count: int
    