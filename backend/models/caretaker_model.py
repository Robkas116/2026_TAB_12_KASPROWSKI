from typing import TYPE_CHECKING, Optional
from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict

from database.database import Base

if TYPE_CHECKING:
    from models.worker_model import Worker
    from models.vehicle_model import Vehicle


class Caretaker(Base):
    """Tabela pośrednia realizująca relację 1:1 z Vehicle oraz N:1 z Worker."""
    __tablename__ = "caretaker"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Relacja N:1 z Worker
    worker_id: Mapped[int] = mapped_column(ForeignKey("worker.id", ondelete="RESTRICT"), nullable=False)
    worker: Mapped["Worker"] = relationship(back_populates="caretakers")

    # Relacja 1:1 z Vehicle (od strony rodzica/opiekuna)
    vehicle: Mapped["Vehicle"] = relationship(back_populates="caretaker")


# Schematy Pydantic
class CaretakerBase(BaseModel):
    worker_id: int


class CaretakerCreate(CaretakerBase):
    pass


class CaretakerPublic(CaretakerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)