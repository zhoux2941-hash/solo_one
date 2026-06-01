from fastapi import APIRouter

from app.models.schemas import Service
from app.services.discovery import ServiceDiscovery, MOCK_SERVICES

router = APIRouter(prefix="/api", tags=["services"])


@router.get("/services", response_model=list[Service])
async def get_services():
    discovery = ServiceDiscovery()
    try:
        services = await discovery.discover_all()
        return services
    finally:
        await discovery.close()


@router.get("/services/{service_name}/detail", response_model=Service)
async def get_service_detail(service_name: str):
    discovery = ServiceDiscovery()
    try:
        services = await discovery.discover_all()
        for svc in services:
            if svc.name == service_name:
                return svc
        for svc in MOCK_SERVICES:
            if svc.name == service_name:
                return svc
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")
    finally:
        await discovery.close()
