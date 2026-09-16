from fastapi import APIRouter

from app.api.v1 import briefs, dashboard, discovery, topics, workspaces

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(workspaces.router)
api_router.include_router(topics.router)
api_router.include_router(briefs.router)
api_router.include_router(discovery.router)
api_router.include_router(dashboard.router)
