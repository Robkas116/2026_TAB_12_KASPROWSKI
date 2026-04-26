from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict
from database.database import Base


if TYPE_CHECKING:
    from models.vehmodel_model import VehModel
    from models.version_model import Version
    from models.worker_model import Worker
class Vehicle(Base):
    """Class representing the Vehicle table in the database, with relationships to VehModel and Version."""
    __tablename__ = "vehicle"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    
    veh_model_id: Mapped[int] = mapped_column(ForeignKey("vehmodel.id", ondelete="RESTRICT"), nullable=False)
    version_id: Mapped[int] = mapped_column(ForeignKey("version.id", ondelete="RESTRICT"), nullable=False)
    
    worker_id: Mapped[int]= mapped_column(Integer, ForeignKey("worker.id", ondelete="SET NULL"), nullable=True)
    
    veh_model: Mapped["VehModel"] = relationship()
    version: Mapped["Version"] = relationship()
    worker: Mapped["Worker"] = relationship()

class VehicleBase(BaseModel):
        """Base class for Vehicle, containing common fields."""
        veh_model_id: int
        version_id: int
        worker_id: int | None = None
class VehicleCreate(VehicleBase):
        """Class with all fields required for creation,
          it inherits from base with veh_model_id and version_id
           and worker, id is generated in the database"""
        pass
class VehicleUpdate(BaseModel):
        """Class with all fields optional for update operations"""
        veh_model_id: Optional[int] = None
        version_id: Optional[int] = None
        worker_id: Optional[int] = None

class VehiclePublic(VehicleBase):
        """Class with properties to return, includes id from database"""
        id: int
        model_config = ConfigDict(from_attributes=True)
class VehiclesPublic(BaseModel):
        """Class for returning a list of vehicles with a count"""
        data: list[VehiclePublic]
        count: int
    