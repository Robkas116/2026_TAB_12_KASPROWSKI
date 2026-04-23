from sqlalchemy import ForeignKey, String, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pydantic import BaseModel, ConfigDict, Field

from models.make_model import Make
from database.database import Base


class VehModel(Base):
    ''' Class representing the Vehicle Model table in the database '''
    __tablename__ = "vehmodel"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Klucz obcy - Poziom bazy danych. 
    # ondelete="RESTRICT" zapobiega usunięciu marki, jeśli posiada powiązane modele.
    make_id: Mapped[int] = mapped_column(ForeignKey("make.id", ondelete="RESTRICT"), nullable=False)

    # Relacja ORM (Many-to-One).
    # Pozwala z poziomu obiektu Model odwołać się do obiektu Make.
    make: Mapped["Make"] = relationship(back_populates="models")

#API schemas (Pydantic)

class VehModelBase(BaseModel):
    ''' Class with common fields for Vehicle Model, used as a base for other schemas '''
    name: str = Field(max_length=100)
    make_id: int = Field(description="ID of the associated Make")


class VehModelCreate(VehModelBase):
    ''' 
    Class with all fields required for creation, 
    it inherits from base with name and email,
    id is generated in the database
      '''
    pass


class VehModelUpdate(VehModelBase):
    ''' Class with all fields optional for update operations '''
    name: str | None = Field(default=None, max_length=100)
    make_id: int | None = Field(default=None)


class VehModelPublic(VehModelBase):
    ''' Class with properties to return, includes id from database '''
    id: int
    #Translate db object to JSON using attribute names
    model_config = ConfigDict(from_attributes=True)


class VehModelsPublic(BaseModel):
    ''' Class for returning a list of models with a count '''
    data: list[VehModelPublic]
    count: int
