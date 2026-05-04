from fastapi import FastAPI

from database.database import Base, engine
from api.router import api_router


Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(api_router)
