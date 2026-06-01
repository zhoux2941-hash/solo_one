from datetime import datetime

from fastapi import APIRouter, Query

from app.models.schemas import TopologyData
from app.services.discovery import ServiceDiscovery
from app.services.prometheus_client import PrometheusClient
from app.services.topology import TopologyBuilder

router = APIRouter(prefix="/api", tags=["topology"])


@router.get("/topology", response_model=TopologyData)
async def get_topology(
    start: datetime = Query(default=None),
    end: datetime = Query(default=None),
):
    if start is None:
        from datetime import timedelta, timezone

        end = datetime.now(timezone.utc)
        start = end - timedelta(hours=1)

    start_ts = start.timestamp()
    end_ts = end.timestamp()

    discovery = ServiceDiscovery()
    prometheus = PrometheusClient()
    builder = TopologyBuilder(prometheus)

    try:
        services = await discovery.discover_all()
        topology = await builder.build_topology(services, start_ts, end_ts)
        return topology
    finally:
        await discovery.close()
        await prometheus.close()
