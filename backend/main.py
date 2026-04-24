from fastapi import FastAPI
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.database import Base, engine, get_db
from api.router import api_router


Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(api_router)
