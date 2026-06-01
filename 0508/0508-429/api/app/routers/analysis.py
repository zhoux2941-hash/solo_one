from fastapi import APIRouter, Query

from app.models.schemas import (
    AnalysisHistoryRecord,
    AnalysisRequest,
    RootCauseAnalysis,
)
from app.services.history import HistoryStore
from app.services.prometheus_client import PrometheusClient
from app.services.root_cause import RootCauseAnalyzer

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analysis/root-cause", response_model=RootCauseAnalysis)
async def analyze_root_cause(request: AnalysisRequest):
    prometheus = PrometheusClient()
    analyzer = RootCauseAnalyzer(prometheus)
    try:
        result = await analyzer.analyze(request.service_name, request.time_range)

        history = HistoryStore()
        try:
            record = AnalysisHistoryRecord(
                id="",
                service_name=result.service_name,
                conclusion=result.conclusion,
                created_at="",
                root_causes=result.root_causes,
            )
            await history.save_analysis(record)
        finally:
            await history.close()

        return result
    finally:
        await prometheus.close()


@router.get("/analysis/history")
async def get_analysis_history(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    history = HistoryStore()
    try:
        records, total = await history.get_history(limit=limit, offset=offset)
        return {"total": total, "records": records}
    finally:
        await history.close()
