from sqlalchemy import Table, Column, Integer, ForeignKey
from database.database import Base

# Association table for the many-to-many relationship between Equipment and SetOfEquipment

equipment_set_association = Table(
    "equipment_set_association",
    Base.metadata,
    Column(
        "equipment_id",
        Integer,
        ForeignKey("equipment.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "set_of_equipment_id",
        Integer,
        ForeignKey("set_of_equipment.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
