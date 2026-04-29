from fastapi import FastAPI

from database.database import Base, engine
from api.router import api_router

from models.worker_model import Worker
from models.vehmodel_model import VehModel
from models.version_model import Version
from models.caretaker_model import Caretaker
from models.vehicle_model import Vehicle



Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(api_router)
