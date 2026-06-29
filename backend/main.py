import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
from database.database import Base, engine, SessionLocal
from api.router import api_router



Base.metadata.create_all(bind=engine)

# Seed default data
def _seed_defaults():
    from models.worker_model import Worker
    from models.action_model import Action, ActionType
    from core.security import get_password_hash

    db = SessionLocal()
    try:
        # Default superuser
        admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@fleet.pl")
        admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
        admin_name = os.getenv("DEFAULT_ADMIN_NAME", "Administrator")

        existing_admin = db.scalar(
            select(Worker).where(Worker.is_superuser == True)
        )
        if not existing_admin:
            admin = Worker(
                name=admin_name,
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                is_superuser=True,
                onboarding_completed=True,
            )
            db.add(admin)
            db.commit()
            print(f"[SEED] Created admin user: {admin_email} (password: {admin_password})")
        else:
            print(f"[SEED] Admin user already exists, skipping")

        # Default actions (service + exploitation types)
        existing_actions = db.scalar(select(Action).limit(1))
        if not existing_actions:
            exploitation_actions = [
                Action(name="Tankowanie", type=ActionType.EXPLOITATION),
                Action(name="Mycie nadwozia", type=ActionType.EXPLOITATION),
                Action(name="Odkurzanie wnętrza", type=ActionType.EXPLOITATION),
                Action(name="Wymiana opon", type=ActionType.EXPLOITATION),
            ]
            service_actions = [
                Action(name="Przegląd techniczny", type=ActionType.SERVICE),
                Action(name="Wymiana oleju", type=ActionType.SERVICE),
                Action(name="Naprawa mechaniczna", type=ActionType.SERVICE),
            ]
            for action in exploitation_actions + service_actions:
                db.add(action)
            db.commit()
            print(f"[SEED] Created {len(exploitation_actions) + len(service_actions)} default actions")
        else:
            print(f"[SEED] Actions already exist, skipping")
    except Exception as e:
        print(f"[SEED] WARNING: Seeding failed ({e}). The app will still start.")
        db.rollback()
    finally:
        db.close()

_seed_defaults()

app = FastAPI(title="Fleet Management System API")

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js app
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers (e.g., Content-Type)
)
app.include_router(api_router, prefix="/api/v1")
