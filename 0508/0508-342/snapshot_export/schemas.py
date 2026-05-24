from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Optional, Any
from enum import Enum
from rules_engine.schemas import AlertLevel


class SummaryType(str, Enum):
    DETAILED = "detailed"
    INSPECTION = "inspection"


class EvidenceItem(BaseModel):
    source_type: str
    source_id: str
    timestamp: datetime
    data_summary: Dict[str, Any]


class AlertSnapshotSummary(BaseModel):
    alert_id: int
    alert_key: str
    pipe_segment_id: str
    location: str
    alert_level: AlertLevel
    alert_score: float
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: Optional[float]
    humidity_evidence: List[EvidenceItem]
    video_evidence: List[EvidenceItem]
    manual_evidence: List[EvidenceItem]
    total_evidence: int
    key_findings: List[str]
    recommendations: List[str]
    generated_at: datetime


class AlertReviewSummary(BaseModel):
    alert_id: int
    alert_key: str
    pipe_segment_id: str
    location: str
    alert_level: AlertLevel
    alert_score: float
    time_range: str
    evidence_breakdown: Dict[str, int]
    critical_timeline: List[Dict[str, Any]]
    review_notes: Optional[str]
    reviewer: Optional[str]
    reviewed_at: Optional[datetime]
    export_format: str
