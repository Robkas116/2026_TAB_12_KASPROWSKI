from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict, Field
from database.database import Base
from models.associations import equipment_set_association

if TYPE_CHECKING:
    from models.set_of_equipment_model import SetOfEquipment


class Equipment(Base):
    """Represents the equipment table in the database.

    This class is an SQLAlchemy ORM model used to map Python objects
    to rows in the 'equipment' database table.

    Attributes:
        id (Mapped[int]): The primary key of the equipment record.
        name (Mapped[str]): The name of the equipment. Cannot be null.
        # tasks (Mapped[list["Task"]]): List of tasks associated with this equipment.
    """

    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    sets: Mapped[list["SetOfEquipment"]] = relationship(
        secondary=equipment_set_association, back_populates="equipments"
    )


class EquipmentBase(BaseModel):
    """Base Pydantic schema containing common fields for Equipment.

    Used as a foundation for other schemas to keep the code DRY (Don't Repeat Yourself).

    Attributes:
        name (str): The name of the equipment, maximum 100 characters.
    """

    name: str = Field(max_length=100)


class EquipmentCreate(EquipmentBase):
    """Pydantic schema for creating a new Equipment record.

    Inherits all fields from EquipmentBase. Does not include an 'id'
    because the database generates it automatically.
    """

    pass


class EquipmentUpdate(EquipmentBase):
    """Pydantic schema for updating an existing Equipment record.

    Inherits from EquipmentBase, but makes fields optional so that partial
    updates (PATCH requests) can be processed without requiring all fields.

    Attributes:
        name (str | None): The new name of the equipment. Defaults to None.
    """

    name: Optional[str] = Field(default=None, max_length=100)


class EquipmentPublic(EquipmentBase):
    """Pydantic schema for returning Equipment data to the client.

    Includes the database-generated 'id' and allows reading data
    directly from SQLAlchemy ORM models.

    Attributes:
        id (int): The database identifier of the equipment.
    """

    id: int

    model_config = ConfigDict(from_attributes=True)


class EquipmentsPublic(BaseModel):
    """Pydantic schema for returning a list of Equipment records.

    Usually used in endpoints that return multiple items with pagination or counting.

    Attributes:
        data (list[EquipmentPublic]): A list of equipment objects.
        count (int): The total number of items returned.
    """

    data: list[EquipmentPublic]
    count: int
