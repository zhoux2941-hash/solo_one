from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from storage.database import get_db
from ingestion.service import IngestionService
from ingestion.schemas import (
    RawDataIngestRequest,
    RawDataResponse,
    IngestBatchResponse,
    SourceType
)

router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("/data", response_model=RawDataResponse)
def ingest_data(request: RawDataIngestRequest, db: Session = Depends(get_db)):
    service = IngestionService(db)
    success, message, raw_data = service.ingest_single(request)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return raw_data


@router.post("/batch", response_model=IngestBatchResponse)
def ingest_batch(requests: List[RawDataIngestRequest], db: Session = Depends(get_db)):
    service = IngestionService(db)
    success_count, failed_count = service.ingest_batch(requests)
    return IngestBatchResponse(
        success_count=success_count,
        failed_count=failed_count,
        message=f"Ingested {success_count} records, {failed_count} failed"
    )


@router.post("/humidity", response_model=RawDataResponse)
def ingest_humidity(
    source_id: str,
    pipe_segment_id: str,
    location: str,
    timestamp: str,
    humidity_percent: float,
    temperature: float = None,
    battery_level: float = None,
    db: Session = Depends(get_db)
):
    from datetime import datetime
    try:
        ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    service = IngestionService(db)
    success, message, raw_data = service.ingest_humidity_data(
        source_id=source_id,
        pipe_segment_id=pipe_segment_id,
        location=location,
        timestamp=ts,
        humidity_percent=humidity_percent,
        temperature=temperature,
        battery_level=battery_level
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return raw_data


@router.post("/video", response_model=RawDataResponse)
def ingest_video(
    source_id: str,
    pipe_segment_id: str,
    location: str,
    timestamp: str,
    leak_confidence: float,
    image_url: str = None,
    water_area_ratio: float = None,
    model_version: str = None,
    db: Session = Depends(get_db)
):
    from datetime import datetime
    try:
        ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    service = IngestionService(db)
    success, message, raw_data = service.ingest_video_data(
        source_id=source_id,
        pipe_segment_id=pipe_segment_id,
        location=location,
        timestamp=ts,
        leak_confidence=leak_confidence,
        image_url=image_url,
        water_area_ratio=water_area_ratio,
        model_version=model_version
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return raw_data


@router.post("/manual", response_model=RawDataResponse)
def ingest_manual(
    source_id: str,
    pipe_segment_id: str,
    location: str,
    timestamp: str,
    inspector_id: str,
    leak_detected: bool,
    leak_severity: str = None,
    notes: str = None,
    db: Session = Depends(get_db)
):
    from datetime import datetime
    try:
        ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    service = IngestionService(db)
    success, message, raw_data = service.ingest_manual_data(
        source_id=source_id,
        pipe_segment_id=pipe_segment_id,
        location=location,
        timestamp=ts,
        inspector_id=inspector_id,
        leak_detected=leak_detected,
        leak_severity=leak_severity,
        notes=notes
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return raw_data
