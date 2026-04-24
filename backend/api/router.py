from fastapi import APIRouter

from api.routes import make_endpoints, vehmodel_endpoints

api_router = APIRouter()
api_router.include_router(make_endpoints.router)
api_router.include_router(vehmodel_endpoints.router)
