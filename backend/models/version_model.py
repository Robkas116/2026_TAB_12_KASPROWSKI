from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict, Field
from database.database import Base

if TYPE_CHECKING:
    from models.set_of_equipment_model import SetOfEquipment
    from models.vehicle_model import Vehicle


class Version(Base):
    """Represents the version table in the database.

    This class is an SQLAlchemy ORM model used to map Python objects
    to rows in the 'version' database table.

    Attributes:
        id (Mapped[int]): The primary key of the version record.
        destination (Mapped[str]): The destination of the version. Cannot be null.
        # tasks (Mapped[list["Task"]]): List of tasks associated with this version.
    """

    __tablename__ = "version"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    destination: Mapped[str] = mapped_column(String(100), nullable=False)

    sets: Mapped[List["SetOfEquipment"]] = relationship(back_populates="version")
    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="version")


class VersionBase(BaseModel):
    """Base Pydantic schema containing common fields for Version.

    Used as a foundation for other schemas to keep the code DRY (Don't Repeat Yourself).

    Attributes:
        destination (str): The destination of the version, maximum 100 characters.
        set_of_equipment_id (int): The ID of the set of equipment to which this version belongs.
    """

    destination: str = Field(max_length=100)


class VersionCreate(VersionBase):
    """Pydantic schema for creating a new Version record.

    Inherits all fields from VersionBase. Does not include an 'id'
    because the database generates it automatically.
    """

    pass


class VersionUpdate(VersionBase):
    """Pydantic schema for updating an existing Version record.

    Inherits from VersionBase, but makes fields optional so that partial
    updates (PATCH requests) can be processed without requiring all fields.

    Attributes:
        destination (str | None): The new destination of the version. Defaults to None.
        set_of_equipment_id (int | None): The new set of equipment ID. Defaults to None.
    """

    destination: Optional[str] = Field(default=None, max_length=100)


class VersionPublic(VersionBase):
    """Pydantic schema for returning Version data to the client.

    Includes the database-generated 'id' and allows reading data
    directly from SQLAlchemy ORM models.

    Attributes:
        id (int): The database identifier of the version.
    """

    id: int
    model_config = ConfigDict(from_attributes=True)


class VersionsPublic(BaseModel):
    """Pydantic schema for returning a list of Version records.

    Usually used in endpoints that return multiple items with pagination or counting.

    Attributes:
        data (list[VersionPublic]): A list of version objects.
        count (int): The total number of items returned.
    """

    data: list[VersionPublic]
    count: int
