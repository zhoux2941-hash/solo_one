import asyncio
import json
import os
import signal
import sys
import time
import uuid
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

import httpx
from prometheus_client import Counter, Gauge, Histogram, start_http_server

from .client import LLMClient
from .metrics import MetricsCollector, RequestMetrics


@dataclass
class WorkerConfig:
    worker_id: str
    test_id: str
    target_url: str
    api_key: Optional[str] = None
    request_timeout: float = 120.0
    max_retries: int = 3
    metrics_server_port: Optional[int] = None
    orchestrator_url: Optional[str] = None
    report_interval: float = 5.0


class WorkerNode:
    def __init__(self, config: WorkerConfig):
        self.config = config
        self.worker_id = config.worker_id
        self.test_id = config.test_id

        self.client = LLMClient(
            base_url=config.target_url,
            api_key=config.api_key,
            timeout=config.request_timeout,
            max_retries=config.max_retries,
        )

        self.metrics_collector = MetricsCollector(config.test_id, config.worker_id)
        self.task_queue: asyncio.Queue = asyncio.Queue(maxsize=10000)
        self._running = False
        self._tasks: List[asyncio.Task] = []

        self._setup_prometheus()

    def _setup_prometheus(self):
        self.requests_total = Counter(
            "llm_worker_requests_total",
            "Total number of requests processed",
            ["worker_id", "test_id", "status"],
        )
        self.request_latency = Histogram(
            "llm_worker_request_latency_seconds",
            "Request latency in seconds",
            ["worker_id", "test_id", "type"],
        )
        self.queue_size = Gauge(
            "llm_worker_queue_size",
            "Current task queue size",
            ["worker_id", "test_id"],
        )
        self.current_qps = Gauge(
            "llm_worker_current_qps",
            "Current QPS",
            ["worker_id", "test_id"],
        )

        if self.config.metrics_server_port:
            try:
                start_http_server(self.config.metrics_server_port)
            except Exception as e:
                print(f"Warning: Failed to start Prometheus server: {e}")

    async def start(self):
        self._running = True
        print(f"Worker {self.worker_id} started for test {self.test_id}")

        for i in range(10):
            task = asyncio.create_task(self._worker_loop(i))
            self._tasks.append(task)

        if self.config.orchestrator_url:
            self._tasks.append(asyncio.create_task(self._report_metrics()))

        await asyncio.gather(*self._tasks, return_exceptions=True)

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        await self.client.close()
        print(f"Worker {self.worker_id} stopped")

    async def submit_task(self, request_log: Dict[str, Any]):
        await self.task_queue.put(request_log)

    async def _worker_loop(self, worker_index: int):
        while self._running:
            try:
                request_log = await self.task_queue.get()
                await self._process_request(request_log)
                self.task_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Worker {self.worker_id} error: {e}")
                await asyncio.sleep(0.1)

    async def _process_request(self, request_log: Dict[str, Any]):
        request_id = request_log.get("id", str(uuid.uuid4()))

        result = await self.client.execute_with_retry(
            request_log,
            lambda: self.metrics_collector.create_metrics(request_id),
        )

        self.metrics_collector.collect(result)

        labels = {"worker_id": self.worker_id, "test_id": self.test_id}
        if result.success:
            self.requests_total.labels(status="success", **labels).inc()
        else:
            self.requests_total.labels(status="failed", **labels).inc()

        if result.total_latency_ms > 0:
            self.request_latency.labels(type="total", **labels).observe(result.total_latency_ms / 1000)
        if result.ttft_ms > 0:
            self.request_latency.labels(type="ttft", **labels).observe(result.ttft_ms / 1000)
        if result.tpot_ms > 0:
            self.request_latency.labels(type="tpot", **labels).observe(result.tpot_ms / 1000)

        self.queue_size.labels(**labels).set(self.task_queue.qsize())

    async def _report_metrics(self):
        interval = self.config.report_interval
        while self._running:
            try:
                await asyncio.sleep(interval)
                recent = self.metrics_collector.get_recent_metrics(1000)
                if recent:
                    qps = len(recent) / interval
                    labels = {"worker_id": self.worker_id, "test_id": self.test_id}
                    self.current_qps.labels(**labels).set(qps)

                    status = {
                        "worker_id": self.worker_id,
                        "test_id": self.test_id,
                        "status": "running",
                        "current_qps": qps,
                        "total_requests": self.metrics_collector.total_requests,
                        "error_rate": self.metrics_collector.error_rate,
                        "last_heartbeat": time.time(),
                    }

                    async with httpx.AsyncClient(timeout=5.0) as client:
                        try:
                            await client.post(
                                f"{self.config.orchestrator_url}/worker/status",
                                json=status,
                            )
                        except Exception as e:
                            pass

                    self.metrics_collector.clear()

            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Metrics report error: {e}")

    def get_statistics(self) -> Dict[str, Any]:
        return {
            "worker_id": self.worker_id,
            "test_id": self.test_id,
            "total_requests": self.metrics_collector.total_requests,
            "success_requests": self.metrics_collector.success_count,
            "failed_requests": self.metrics_collector.failed_count,
            "error_rate": self.metrics_collector.error_rate,
            "queue_size": self.task_queue.qsize(),
        }


async def run_standalone_worker():
    config = WorkerConfig(
        worker_id=os.environ.get("WORKER_ID", f"worker-{uuid.uuid4().hex[:8]}"),
        test_id=os.environ.get("TEST_ID", "test-001"),
        target_url=os.environ.get("TARGET_URL", "http://localhost:8000"),
        api_key=os.environ.get("API_KEY"),
        request_timeout=float(os.environ.get("REQUEST_TIMEOUT", "120")),
        max_retries=int(os.environ.get("MAX_RETRIES", "3")),
        metrics_server_port=int(os.environ.get("METRICS_PORT", "9090")),
        orchestrator_url=os.environ.get("ORCHESTRATOR_URL"),
    )

    worker = WorkerNode(config)

    async def handle_shutdown():
        print("\nReceived shutdown signal...")
        await worker.stop()
        sys.exit(0)

    for sig in (signal.SIGINT, signal.SIGTERM):
        asyncio.get_event_loop().add_signal_handler(
            sig, lambda: asyncio.create_task(handle_shutdown())
        )

    mock_task = asyncio.create_task(_generate_mock_requests(worker))

    await worker.start()


async def _generate_mock_requests(worker: WorkerNode):
    while True:
        request = {
            "id": str(uuid.uuid4()),
            "timestamp": time.time(),
            "completion_type": "chat_completion",
            "model": os.environ.get("MODEL", "gpt-4"),
            "messages": [{"role": "user", "content": "Hello, world!"}],
            "temperature": 0.7,
            "max_tokens": 100,
            "stream": True,
        }
        await worker.submit_task(request)
        await asyncio.sleep(float(os.environ.get("REQUEST_INTERVAL", "0.1")))


if __name__ == "__main__":
    asyncio.run(run_standalone_worker())
