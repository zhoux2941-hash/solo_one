from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict
from rules_engine.schemas import AlertLevel


class TimeWindowMergeResult(BaseModel):
    alert_key: str
    pipe_segment_id: str
    location: str
    start_time: datetime
    end_time: Optional[datetime] = None
    raw_data_ids: List[int]
    is_new_alert: bool
    alert_level: Optional[AlertLevel] = None
    alert_score: Optional[float] = None


class AlertEvent(BaseModel):
    id: int
    alert_key: str
    pipe_segment_id: str
    location: str
    alert_level: AlertLevel
    alert_score: float
    start_time: datetime
    end_time: Optional[datetime]
    status: str
    humidity_count: int
    video_count: int
    manual_count: int
    evidence_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MergeSummary(BaseModel):
    processed_count: int
    new_alerts: int
    updated_alerts: int
    skipped_records: int
    timestamp: datetime
