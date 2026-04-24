from typing import TYPE_CHECKING

from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pydantic import BaseModel, ConfigDict, Field

from database.database import Base


if TYPE_CHECKING:
    from models.vehmodel_model import VehModel


class Make(Base):
    ''' Class representing the Make table in the database '''
    __tablename__ = "make"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relacja ORM (One-to-Many). 
    # Typujemy jako listę modeli. Używamy stringa "Model" dla uniknięcia błędów cyklicznych importów.
    models: Mapped[list["VehModel"]] = relationship(back_populates="make")

#API schemas (Pydantic)

class MakeBase(BaseModel):
    ''' Class with common fields for Make, used as a base for other schemas '''
    name: str = Field(max_length=100)


class MakeCreate(MakeBase):
    ''' 
    Class with all fields required for creation, 
    it inherits from base with name and email,
    id is generated in the database
      '''
    pass


class MakeUpdate(MakeBase):
    ''' Class with all fields optional for update operations '''
    name: str | None = Field(default=None, max_length=100)


class MakePublic(MakeBase):
    ''' Class with properties to return, includes id from database '''
    id: int
    #Translate db object to JSON using attribute names
    model_config = ConfigDict(from_attributes=True)


class MakesPublic(BaseModel):
    ''' Class for returning a list of makes with a count '''
    data: list[MakePublic]
    count: int
