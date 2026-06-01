from datetime import datetime

from fastapi import APIRouter, Query

from app.models.schemas import ChangeEvent
from app.services.cd_integration import CDIntegration

router = APIRouter(prefix="/api", tags=["events"])


@router.get("/events/changes", response_model=list[ChangeEvent])
async def get_change_events(
    service_name: str = Query(default="", description="服务名过滤"),
    start: datetime = Query(default=None),
    end: datetime = Query(default=None),
):
    if start is None:
        from datetime import timedelta, timezone

        end = datetime.now(timezone.utc)
        start = end - timedelta(hours=24)

    start_str = start.isoformat()
    end_str = end.isoformat()

    cd = CDIntegration()
    try:
        events = await cd.get_change_events(service_name, start_str, end_str)
        return events
    finally:
        await cd.close()
