from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
from database.database import Base, engine
from api.router import api_router



Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fleet Management System API")

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js app
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers (e.g., Content-Type)
)
app.include_router(api_router)
