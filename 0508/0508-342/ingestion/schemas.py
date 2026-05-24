from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum


class SourceType(str, Enum):
    HUMIDITY_SENSOR = "humidity_sensor"
    VIDEO_CAPTURE = "video_capture"
    MANUAL_INSPECTION = "manual_inspection"


class HumiditySensorData(BaseModel):
    humidity_percent: float = Field(..., ge=0, le=100)
    temperature: Optional[float] = None
    battery_level: Optional[float] = None
    threshold_exceeded: bool = False


class VideoCaptureData(BaseModel):
    image_url: Optional[str] = None
    leak_confidence: float = Field(..., ge=0, le=1)
    water_area_ratio: Optional[float] = None
    detected_objects: Optional[List[str]] = None
    model_version: Optional[str] = None


class ManualInspectionData(BaseModel):
    inspector_id: str
    leak_detected: bool
    leak_severity: Optional[str] = None
    notes: Optional[str] = None
    photos: Optional[List[str]] = None
    inspection_duration_seconds: Optional[int] = None


class RawDataIngestRequest(BaseModel):
    source_type: SourceType
    source_id: str
    pipe_segment_id: str
    location: str
    timestamp: datetime
    data: Dict[str, Any]


class RawDataResponse(BaseModel):
    id: int
    source_type: str
    source_id: str
    pipe_segment_id: str
    location: str
    timestamp: datetime
    received_at: datetime
    is_processed: bool

    class Config:
        from_attributes = True


class IngestBatchResponse(BaseModel):
    success_count: int
    failed_count: int
    message: str
