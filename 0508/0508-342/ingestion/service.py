from sqlalchemy.orm import Session
from typing import List, Tuple
from datetime import datetime
from storage.models import RawData
from storage.repository import RawDataRepository
from ingestion.schemas import RawDataIngestRequest, SourceType
from ingestion.validators import DataValidator
import logging

logger = logging.getLogger(__name__)


class IngestionService:
    def __init__(self, db: Session):
        self.db = db
        self.validator = DataValidator()

    def ingest_single(self, request: RawDataIngestRequest) -> Tuple[bool, str, RawData]:
        is_valid, error_msg, validated_data = self.validator.validate_source_data(
            request.source_type, request.data
        )

        if not is_valid:
            logger.warning(f"Data validation failed: {error_msg}")
            return False, error_msg or "Validation failed", None

        raw_data = RawData(
            source_type=request.source_type,
            source_id=request.source_id,
            pipe_segment_id=request.pipe_segment_id,
            location=request.location,
            data_payload=validated_data,
            timestamp=request.timestamp,
            is_processed=False
        )

        saved_data = RawDataRepository.create(self.db, raw_data)
        logger.info(f"Ingested raw data from {request.source_type} at {request.location}")
        return True, "Ingested successfully", saved_data

    def ingest_batch(self, requests: List[RawDataIngestRequest]) -> Tuple[int, int]:
        success_count = 0
        failed_count = 0

        for request in requests:
            success, _, _ = self.ingest_single(request)
            if success:
                success_count += 1
            else:
                failed_count += 1

        return success_count, failed_count

    def ingest_humidity_data(
        self,
        source_id: str,
        pipe_segment_id: str,
        location: str,
        timestamp: datetime,
        humidity_percent: float,
        temperature: float = None,
        battery_level: float = None,
        threshold_exceeded: bool = None
    ) -> Tuple[bool, str, RawData]:
        if threshold_exceeded is None:
            threshold_exceeded = humidity_percent > 80

        data = {
            "humidity_percent": humidity_percent,
            "temperature": temperature,
            "battery_level": battery_level,
            "threshold_exceeded": threshold_exceeded
        }

        request = RawDataIngestRequest(
            source_type=SourceType.HUMIDITY_SENSOR,
            source_id=source_id,
            pipe_segment_id=pipe_segment_id,
            location=location,
            timestamp=timestamp,
            data=data
        )
        return self.ingest_single(request)

    def ingest_video_data(
        self,
        source_id: str,
        pipe_segment_id: str,
        location: str,
        timestamp: datetime,
        leak_confidence: float,
        image_url: str = None,
        water_area_ratio: float = None,
        detected_objects: List[str] = None,
        model_version: str = None
    ) -> Tuple[bool, str, RawData]:
        data = {
            "leak_confidence": leak_confidence,
            "image_url": image_url,
            "water_area_ratio": water_area_ratio,
            "detected_objects": detected_objects or [],
            "model_version": model_version
        }

        request = RawDataIngestRequest(
            source_type=SourceType.VIDEO_CAPTURE,
            source_id=source_id,
            pipe_segment_id=pipe_segment_id,
            location=location,
            timestamp=timestamp,
            data=data
        )
        return self.ingest_single(request)

    def ingest_manual_data(
        self,
        source_id: str,
        pipe_segment_id: str,
        location: str,
        timestamp: datetime,
        inspector_id: str,
        leak_detected: bool,
        leak_severity: str = None,
        notes: str = None,
        photos: List[str] = None,
        inspection_duration_seconds: int = None
    ) -> Tuple[bool, str, RawData]:
        data = {
            "inspector_id": inspector_id,
            "leak_detected": leak_detected,
            "leak_severity": leak_severity,
            "notes": notes,
            "photos": photos or [],
            "inspection_duration_seconds": inspection_duration_seconds
        }

        request = RawDataIngestRequest(
            source_type=SourceType.MANUAL_INSPECTION,
            source_id=source_id,
            pipe_segment_id=pipe_segment_id,
            location=location,
            timestamp=timestamp,
            data=data
        )
        return self.ingest_single(request)
