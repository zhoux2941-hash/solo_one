from pydantic import BaseModel
from datetime import datetime
from typing import Dict, List, Optional
from enum import Enum


class AlertLevel(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertRuleResult(BaseModel):
    alert_level: AlertLevel
    alert_score: float
    evidence_count: int
    contributing_sources: Dict[str, int]
    rule_triggered: List[str]
    recommendations: List[str]


class TimeWindowStats(BaseModel):
    pipe_segment_id: str
    start_time: datetime
    end_time: datetime
    total_records: int
    humidity_records: int
    video_records: int
    manual_records: int
    avg_humidity: Optional[float] = None
    max_humidity: Optional[float] = None
    avg_video_confidence: Optional[float] = None
    max_video_confidence: Optional[float] = None
    manual_detection_count: int = 0
