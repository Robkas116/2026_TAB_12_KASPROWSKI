from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pydantic import BaseModel, ConfigDict, Field

from database.database import Base


if TYPE_CHECKING:
    from models.equipment_model import Equipment


class SetOfEquipment(Base):
    """Represents the set_of_equipment table in the database.

    This class is an SQLAlchemy ORM model used to map Python objects 
    to rows in the 'set_of_equipment' database table.

    Attributes:
        id (Mapped[int]): The primary key of the set of equipment record.
        name (Mapped[str]): The name of the set of equipment (max 100 characters).
        equipment_id (Mapped[int]): The foreign key linking to the equipment table.
        equipment (Mapped["Equipment"]): The relationship object pointing to the 
            specific equipment this set belongs to.
    """
    __tablename__ = "set_of_equipment"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipment.id"))

    equipment: Mapped["Equipment"] = relationship(back_populates="sets")


# --- API schemas (Pydantic) ---

class SetOfEquipmentBase(BaseModel):
    """Base Pydantic schema containing common fields for SetOfEquipment.

    Used as a foundation for other schemas to keep the code DRY.

    Attributes:
        name (str): The name of the set of equipment, maximum 100 characters.
        equipment_id (int): The ID of the equipment to which this set belongs.
    """
    name: str = Field(max_length=100)
    equipment_id: int


class SetOfEquipmentCreate(SetOfEquipmentBase):
    """Pydantic schema for creating a new SetOfEquipment record.

    Inherits all fields from SetOfEquipmentBase. Does not include an 'id' 
    because the database generates it automatically upon insertion.
    """
    pass


class SetOfEquipmentUpdate(SetOfEquipmentBase):
    """Pydantic schema for updating an existing SetOfEquipment record.

    Inherits from SetOfEquipmentBase, but makes fields optional so that partial 
    updates (PATCH requests) can be processed without requiring all fields.

    Attributes:
        name (Optional[str]): The new name of the set of equipment. Defaults to None.
        equipment_id (Optional[int]): The new equipment ID if moving the set to another equipment. Defaults to None.
    """
    name: Optional[str] = Field(default=None, max_length=100)
    equipment_id: Optional[int] = None


class SetOfEquipmentPublic(SetOfEquipmentBase):
    """Pydantic schema for returning SetOfEquipment data to the client.

    Includes the database-generated 'id' and allows reading data 
    directly from SQLAlchemy ORM models.

    Attributes:
        id (int): The database identifier of the set of equipment.
        model_config (ConfigDict): Configuration allowing Pydantic to read from ORM object attributes.
    """
    id: int
    
    model_config = ConfigDict(from_attributes=True)


class SetOfEquipmentsPublic(BaseModel):
    """Pydantic schema for returning a list of SetOfEquipment records.

    Usually used in endpoints that return multiple items with pagination.

    Attributes:
        data (list[SetOfEquipmentPublic]): A list of set of equipment objects.
        count (int): The total number of items returned.
    """
    data: list[SetOfEquipmentPublic]
    count: int