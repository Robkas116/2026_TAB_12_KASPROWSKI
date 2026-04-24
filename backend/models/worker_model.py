from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from pydantic import BaseModel, ConfigDict, Field, EmailStr

from database.database import Base


class Worker(Base):
    ''' Class representing the Worker table in the database '''
    __tablename__ = "worker"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

#API schemas (Pydantic)

class WorkerBase(BaseModel):
    ''' Class with common fields for Worker, used as a base for other schemas '''
    name: str = Field(max_length=100)
    email: EmailStr = Field(max_length=120)


class WorkerCreate(WorkerBase):
    ''' 
    Class with all fields required for creation, 
    it inherits from base with name and email,
    id is generated in the database
      '''
    pass


class WorkerUpdate(BaseModel):
    ''' Class with all fields optional for update operations '''
    name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = Field(default=None, max_length=120)


class WorkerPublic(WorkerBase):
    ''' Class with properties to return, includes id from database '''
    id: int
    #Translate db object to JSON using attribute names
    model_config = ConfigDict(from_attributes=True)


class WorkersPublic(BaseModel):
    ''' Class for returning a list of workers with a count '''
    data: list[WorkerPublic]
    count: int
