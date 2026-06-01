from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ServiceInstance(BaseModel):
    name: str
    address: str
    port: int
    status: str
    restart_count: int = 0
    labels: dict[str, str] = Field(default_factory=dict)


class Service(BaseModel):
    name: str
    instances: list[ServiceInstance] = Field(default_factory=list)
    source: Literal["kubernetes", "consul"] = "kubernetes"
    version: str = "unknown"


class ServiceMetrics(BaseModel):
    request_count: float = 0.0
    error_rate: float = 0.0
    p99_latency: float = 0.0


class TopologyNode(BaseModel):
    id: str
    name: str
    status: Literal["healthy", "warning", "error"] = "healthy"
    metrics: ServiceMetrics = Field(default_factory=ServiceMetrics)


class TopologyEdge(BaseModel):
    source: str
    target: str
    call_count: float = 0.0
    error_rate: float = 0.0
    avg_latency: float = 0.0
    health: Literal["healthy", "warning", "error"] = "healthy"


class TopologyData(BaseModel):
    nodes: list[TopologyNode] = Field(default_factory=list)
    edges: list[TopologyEdge] = Field(default_factory=list)


class RootCauseEntry(BaseModel):
    service_name: str
    correlation_score: float = 0.0
    event_type: str = ""
    event_time: str = ""
    description: str = ""
    recommendation: str = ""


class EventChainItem(BaseModel):
    service_name: str
    event: str
    time: str
    impact: str = ""


class RootCauseAnalysis(BaseModel):
    service_name: str
    anomaly_detected: bool = False
    root_causes: list[RootCauseEntry] = Field(default_factory=list)
    chain: list[EventChainItem] = Field(default_factory=list)
    conclusion: str = ""


class TimeSeriesPoint(BaseModel):
    timestamp: float
    value: float


class MetricSeries(BaseModel):
    service_name: str
    metric_type: str
    data_points: list[TimeSeriesPoint] = Field(default_factory=list)


class ChangeEvent(BaseModel):
    service_name: str
    event_type: str
    source: str
    timestamp: str
    details: dict = Field(default_factory=dict)


class AnalysisHistoryRecord(BaseModel):
    id: str
    service_name: str
    conclusion: str
    created_at: str
    root_causes: list[RootCauseEntry] = Field(default_factory=list)


class TimeRange(BaseModel):
    start: datetime
    end: datetime


class AnalysisRequest(BaseModel):
    service_name: str
    time_range: TimeRange
