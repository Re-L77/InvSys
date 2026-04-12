from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.catalogs import router as catalogs_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.movements import router as movements_router
from app.api.v1.endpoints.reports import router as reports_router
from app.api.v1.endpoints.users import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(catalogs_router)
api_router.include_router(movements_router)
api_router.include_router(reports_router)
api_router.include_router(users_router)
api_router.include_router(health_router)
