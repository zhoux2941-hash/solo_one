from datetime import datetime

from fastapi import APIRouter, Query

from app.models.schemas import MetricSeries
from app.services.prometheus_client import PrometheusClient

router = APIRouter(prefix="/api", tags=["metrics"])


@router.get("/metrics/timeseries", response_model=list[MetricSeries])
async def get_timeseries(
    services: str = Query(..., description="逗号分隔的服务名列表"),
    metric_type: str = Query(..., description="指标类型: request_count, error_rate, p99_latency"),
    start: datetime = Query(default=None),
    end: datetime = Query(default=None),
    step: int = Query(default=60, ge=15, le=3600, description="查询步长（秒）"),
):
    if start is None:
        from datetime import timedelta, timezone

        end = datetime.now(timezone.utc)
        start = end - timedelta(hours=1)

    service_list = [s.strip() for s in services.split(",") if s.strip()]
    start_ts = start.timestamp()
    end_ts = end.timestamp()

    prometheus = PrometheusClient()
    try:
        result = await prometheus.get_timeseries(service_list, metric_type, start_ts, end_ts, step)
        return result
    finally:
        await prometheus.close()
