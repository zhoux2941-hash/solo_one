from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from storage.database import get_db
from storage.repository import AlertRepository
from merging_service.service import MergingService
from merging_service.schemas import AlertEvent, MergeSummary
from snapshot_export.service import SnapshotExportService
from snapshot_export.schemas import SummaryType

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=List[AlertEvent])
def get_alerts(
    status: Optional[str] = None,
    pipe_segment_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if status:
        alerts = AlertRepository.get_pending_review(db)
        alerts = [a for a in alerts if a.status == status]
    elif pipe_segment_id:
        alerts = AlertRepository.get_by_pipe_segment(db, pipe_segment_id)
    else:
        alerts = AlertRepository.get_pending_review(db)
    return alerts


@router.get("/{alert_id}", response_model=AlertEvent)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = AlertRepository.get_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/review")
def review_alert(
    alert_id: int,
    reviewed_by: str,
    status: str,
    review_notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    alert = AlertRepository.get_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = status
    alert.reviewed_by = reviewed_by
    alert.reviewed_at = datetime.now()
    alert.review_notes = review_notes

    AlertRepository.update(db, alert)
    return {"message": "Alert reviewed successfully", "alert_id": alert_id}


@router.post("/process", response_model=MergeSummary)
def process_pending_data(db: Session = Depends(get_db)):
    service = MergingService(db)
    return service.process_incoming_data()


@router.get("/summary/pending")
def get_pending_summary(db: Session = Depends(get_db)):
    service = MergingService(db)
    return service.get_active_alerts_summary()


@router.post("/{alert_id}/snapshot")
def generate_snapshot(alert_id: int, db: Session = Depends(get_db)):
    service = SnapshotExportService(db)
    success, snapshot = service.generate_alert_snapshot(alert_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to generate snapshot")
    return {"message": "Snapshot generated", "snapshot_id": snapshot.id}


@router.get("/{alert_id}/review-summary")
def get_review_summary(
    alert_id: int,
    format: str = Query("json", description="Output format: json or text"),
    summary_type: SummaryType = Query(SummaryType.DETAILED, description="Summary type: detailed or inspection"),
    db: Session = Depends(get_db)
):
    service = SnapshotExportService(db)

    if summary_type == SummaryType.INSPECTION and format == "text":
        success, text = service.export_inspection_summary_to_text(alert_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to generate summary")
        return {"content": text, "summary_type": "inspection"}
    elif summary_type == SummaryType.INSPECTION:
        success, data = service.export_inspection_summary(alert_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to generate summary")
        return data

    if format == "text":
        success, text = service.export_to_text(alert_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to generate summary")
        return {"content": text, "summary_type": "detailed"}

    success, data = service.export_detailed_summary(alert_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to generate summary")
    return data


@router.post("/recalculate/segment/{pipe_segment_id}")
def recalculate_segment(
    pipe_segment_id: str,
    db: Session = Depends(get_db)
):
    service = MergingService(db)
    updated, archived = service.recalculate_by_pipe_segment(pipe_segment_id)
    return {
        "pipe_segment_id": pipe_segment_id,
        "alerts_updated": updated,
        "alerts_archived": archived,
        "message": f"Recalculated {updated + archived} alerts for segment {pipe_segment_id}"
    }


@router.post("/recalculate/all")
def recalculate_all_segments(db: Session = Depends(get_db)):
    service = MergingService(db)
    segments_count, updated, archived = service.recalculate_all_segments()
    return {
        "segments_processed": segments_count,
        "alerts_updated": updated,
        "alerts_archived": archived,
        "message": f"Recalculated alerts across {segments_count} segments"
    }


@router.post("/recalculate/segment/{pipe_segment_id}/date-range")
def recalculate_segment_by_date_range(
    pipe_segment_id: str,
    start_time: str = Query(..., description="Start time in ISO format (e.g., 2024-01-01T00:00:00)"),
    end_time: str = Query(..., description="End time in ISO format (e.g., 2024-01-02T00:00:00)"),
    executed_by: Optional[str] = Query(None, description="Executor identifier"),
    db: Session = Depends(get_db)
):
    try:
        start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO format.")

    service = MergingService(db)
    updated, archived, merged = service.recalculate_by_date_range(
        pipe_segment_id, start_dt, end_dt, executed_by
    )
    return {
        "pipe_segment_id": pipe_segment_id,
        "date_range": {
            "start_time": start_time,
            "end_time": end_time
        },
        "alerts_updated": updated,
        "alerts_archived": archived,
        "alerts_merged": merged,
        "message": f"Recalculated {updated + archived + merged} alerts in date range"
    }


@router.post("/recalculate/all/date-range")
def recalculate_all_by_date_range(
    start_time: str = Query(..., description="Start time in ISO format"),
    end_time: str = Query(..., description="End time in ISO format"),
    executed_by: Optional[str] = Query(None, description="Executor identifier"),
    db: Session = Depends(get_db)
):
    try:
        start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO format.")

    service = MergingService(db)
    results = service.recalculate_all_by_date_range(start_dt, end_dt, executed_by)
    return {
        "date_range": {
            "start_time": start_time,
            "end_time": end_time
        },
        "segments": results,
        "message": f"Recalculated alerts across {len(results)} segments"
    }


@router.get("/recalculation/last")
def get_last_recalculation(
    pipe_segment_id: Optional[str] = Query(None, description="Filter by pipe segment ID"),
    db: Session = Depends(get_db)
):
    service = MergingService(db)
    last_recalc = service.get_last_recalculation(pipe_segment_id)
    if not last_recalc:
        return {"message": "No recalculation history found", "data": None}
    return {
        "message": "Last recalculation parameters retrieved",
        "data": last_recalc
    }


@router.get("/recalculation/history")
def get_recalculation_history(
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    service = MergingService(db)
    history = service.get_recalculation_history(limit)
    return {
        "count": len(history),
        "history": history
    }
