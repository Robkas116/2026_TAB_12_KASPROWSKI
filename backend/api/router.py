from fastapi import APIRouter

from api.routes import (
    make_endpoints,
    vehmodel_endpoints,
    equipment_endpoints,
    set_of_equipment_endpoints,
    version_endpoints,
    action_endpoints,
    is_performed_endpoints,
)

api_router = APIRouter()
api_router.include_router(make_endpoints.router)
api_router.include_router(vehmodel_endpoints.router)
api_router.include_router(equipment_endpoints.router)
api_router.include_router(set_of_equipment_endpoints.router)
api_router.include_router(version_endpoints.router)
api_router.include_router(action_endpoints.router)
api_router.include_router(is_performed_endpoints.router)
