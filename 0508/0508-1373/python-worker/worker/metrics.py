import time
import uuid
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime, timezone


class CompletionType(str, Enum):
    TEXT_COMPLETION = "text_completion"
    CHAT_COMPLETION = "chat_completion"


class ErrorType(str, Enum):
    CONNECTION_ERROR = "connection_error"
    TIMEOUT = "timeout"
    HTTP_ERROR = "http_error"
    STREAM_ERROR = "stream_error"
    PAYLOAD_ERROR = "payload_error"
    MAX_RETRIES_EXCEEDED = "max_retries_exceeded"
    CANCELLED = "cancelled"


def parse_timestamp(ts) -> float:
    if ts is None:
        return time.time()

    if isinstance(ts, (int, float)):
        if ts > 1e18:
            return ts / 1e9
        elif ts > 1e15:
            return ts / 1e3
        elif ts > 1e12:
            return ts / 1e3
        elif ts > 1e9:
            return float(ts)
        else:
            return float(ts)

    if isinstance(ts, str):
        for fmt in (
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S.%f%z",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S.%f",
            "%Y-%m-%d %H:%M:%S",
        ):
            try:
                dt = datetime.strptime(ts, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.timestamp()
            except ValueError:
                continue
        try:
            return float(ts)
        except (ValueError, TypeError):
            pass

    return time.time()


@dataclass
class RequestMetrics:
    test_id: str
    worker_id: str
    request_id: str
    timestamp: float = field(default_factory=time.time)
    ttft_ms: float = 0.0
    tpot_ms: float = 0.0
    total_latency_ms: float = 0.0
    response_length: int = 0
    token_count: int = 0
    prompt_tokens: int = 0
    output_tokens: int = 0
    status_code: int = 0
    success: bool = False
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    completion_type: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "test_id": self.test_id,
            "worker_id": self.worker_id,
            "request_id": self.request_id,
            "timestamp": self.timestamp,
            "ttft_ms": self.ttft_ms,
            "tpot_ms": self.tpot_ms,
            "total_latency_ms": self.total_latency_ms,
            "response_length": self.response_length,
            "token_count": self.token_count,
            "prompt_tokens": self.prompt_tokens,
            "output_tokens": self.output_tokens,
            "status_code": self.status_code,
            "success": self.success,
            "error_type": self.error_type,
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "completion_type": self.completion_type,
        }


class MetricsCollector:
    def __init__(self, test_id: str, worker_id: str):
        self.test_id = test_id
        self.worker_id = worker_id
        self.metrics: List[RequestMetrics] = []
        self._total_requests = 0
        self._success_count = 0
        self._failed_count = 0

    def create_metrics(self, request_id: Optional[str] = None) -> RequestMetrics:
        return RequestMetrics(
            test_id=self.test_id,
            worker_id=self.worker_id,
            request_id=request_id or str(uuid.uuid4()),
        )

    def collect(self, metrics: RequestMetrics) -> None:
        self.metrics.append(metrics)
        self._total_requests += 1
        if metrics.success:
            self._success_count += 1
        else:
            self._failed_count += 1

    @property
    def total_requests(self) -> int:
        return self._total_requests

    @property
    def success_count(self) -> int:
        return self._success_count

    @property
    def failed_count(self) -> int:
        return self._failed_count

    @property
    def error_rate(self) -> float:
        if self._total_requests == 0:
            return 0.0
        return (self._failed_count / self._total_requests) * 100

    def get_recent_metrics(self, count: int = 100) -> List[RequestMetrics]:
        return self.metrics[-count:]

    def clear(self) -> None:
        self.metrics = []
        self._total_requests = 0
        self._success_count = 0
        self._failed_count = 0
