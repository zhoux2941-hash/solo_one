import logging
import math
import random
import time

import httpx

from app.config import PROMETHEUS_URL
from app.models.schemas import MetricSeries, TimeSeriesPoint

logger = logging.getLogger(__name__)

MOCK_SERVICE_METRICS = {
    "order-api": {"request_count": 15820.0, "error_rate": 0.083, "p99_latency": 1240.0},
    "payment-service": {"request_count": 9540.0, "error_rate": 0.062, "p99_latency": 890.0},
    "user-service": {"request_count": 7230.0, "error_rate": 0.003, "p99_latency": 120.0},
    "inventory-service": {"request_count": 6100.0, "error_rate": 0.045, "p99_latency": 680.0},
    "notification-service": {"request_count": 3210.0, "error_rate": 0.002, "p99_latency": 95.0},
    "gateway": {"request_count": 42100.0, "error_rate": 0.035, "p99_latency": 520.0},
    "auth-service": {"request_count": 12300.0, "error_rate": 0.004, "p99_latency": 145.0},
    "cart-service": {"request_count": 8700.0, "error_rate": 0.005, "p99_latency": 160.0},
    "product-service": {"request_count": 11200.0, "error_rate": 0.003, "p99_latency": 130.0},
    "search-service": {"request_count": 5400.0, "error_rate": 0.002, "p99_latency": 110.0},
    "recommendation-engine": {"request_count": 4300.0, "error_rate": 0.008, "p99_latency": 210.0},
    "coupon-service": {"request_count": 2800.0, "error_rate": 0.003, "p99_latency": 95.0},
    "shipping-service": {"request_count": 3900.0, "error_rate": 0.004, "p99_latency": 180.0},
    "email-service": {"request_count": 1600.0, "error_rate": 0.002, "p99_latency": 85.0},
    "sms-service": {"request_count": 900.0, "error_rate": 0.001, "p99_latency": 70.0},
    "analytics-service": {"request_count": 2100.0, "error_rate": 0.002, "p99_latency": 150.0},
    "report-service": {"request_count": 1800.0, "error_rate": 0.003, "p99_latency": 320.0},
    "audit-log-service": {"request_count": 7500.0, "error_rate": 0.001, "p99_latency": 55.0},
    "config-service": {"request_count": 4500.0, "error_rate": 0.001, "p99_latency": 40.0},
    "file-storage-service": {"request_count": 3200.0, "error_rate": 0.004, "p99_latency": 240.0},
    "image-processor": {"request_count": 1900.0, "error_rate": 0.006, "p99_latency": 380.0},
    "pricing-service": {"request_count": 5600.0, "error_rate": 0.002, "p99_latency": 90.0},
    "loyalty-service": {"request_count": 2400.0, "error_rate": 0.003, "p99_latency": 115.0},
    "review-service": {"request_count": 3100.0, "error_rate": 0.002, "p99_latency": 100.0},
    "wishlist-service": {"request_count": 1700.0, "error_rate": 0.002, "p99_latency": 80.0},
    "tax-service": {"request_count": 2600.0, "error_rate": 0.003, "p99_latency": 130.0},
    "payment-gateway": {"request_count": 8100.0, "error_rate": 0.012, "p99_latency": 280.0},
    "fraud-detection": {"request_count": 7800.0, "error_rate": 0.005, "p99_latency": 190.0},
    "cache-service": {"request_count": 18500.0, "error_rate": 0.001, "p99_latency": 12.0},
    "message-queue-consumer": {"request_count": 6200.0, "error_rate": 0.007, "p99_latency": 200.0},
    "scheduler-service": {"request_count": 800.0, "error_rate": 0.002, "p99_latency": 60.0},
    "health-check-service": {"request_count": 15000.0, "error_rate": 0.0, "p99_latency": 5.0},
}

DEFAULT_MOCK_METRICS = {"request_count": 1000.0, "error_rate": 0.003, "p99_latency": 100.0}

MOCK_EDGE_METRICS = {
    ("gateway", "auth-service"): {"call_count": 10500.0, "error_rate": 0.004, "avg_latency": 130.0},
    ("gateway", "order-api"): {"call_count": 12800.0, "error_rate": 0.078, "avg_latency": 980.0},
    ("gateway", "payment-service"): {"call_count": 7200.0, "error_rate": 0.055, "avg_latency": 760.0},
    ("gateway", "user-service"): {"call_count": 6100.0, "error_rate": 0.003, "avg_latency": 110.0},
    ("gateway", "product-service"): {"call_count": 9200.0, "error_rate": 0.003, "avg_latency": 125.0},
    ("gateway", "search-service"): {"call_count": 4800.0, "error_rate": 0.002, "avg_latency": 105.0},
    ("gateway", "cart-service"): {"call_count": 7100.0, "error_rate": 0.005, "avg_latency": 155.0},
    ("gateway", "recommendation-engine"): {"call_count": 3600.0, "error_rate": 0.008, "avg_latency": 200.0},
    ("order-api", "payment-service"): {"call_count": 8900.0, "error_rate": 0.065, "avg_latency": 720.0},
    ("order-api", "inventory-service"): {"call_count": 7600.0, "error_rate": 0.052, "avg_latency": 590.0},
    ("order-api", "user-service"): {"call_count": 4200.0, "error_rate": 0.003, "avg_latency": 105.0},
    ("order-api", "notification-service"): {"call_count": 3100.0, "error_rate": 0.008, "avg_latency": 88.0},
    ("order-api", "cart-service"): {"call_count": 5200.0, "error_rate": 0.005, "avg_latency": 140.0},
    ("order-api", "coupon-service"): {"call_count": 2400.0, "error_rate": 0.003, "avg_latency": 90.0},
    ("order-api", "pricing-service"): {"call_count": 4800.0, "error_rate": 0.002, "avg_latency": 85.0},
    ("payment-service", "notification-service"): {"call_count": 2800.0, "error_rate": 0.002, "avg_latency": 72.0},
    ("payment-service", "payment-gateway"): {"call_count": 7800.0, "error_rate": 0.012, "avg_latency": 270.0},
    ("payment-service", "fraud-detection"): {"call_count": 7400.0, "error_rate": 0.005, "avg_latency": 185.0},
    ("payment-service", "loyalty-service"): {"call_count": 2100.0, "error_rate": 0.003, "avg_latency": 110.0},
    ("inventory-service", "notification-service"): {"call_count": 1500.0, "error_rate": 0.001, "avg_latency": 65.0},
    ("inventory-service", "cache-service"): {"call_count": 5800.0, "error_rate": 0.001, "avg_latency": 10.0},
    ("auth-service", "user-service"): {"call_count": 9800.0, "error_rate": 0.003, "avg_latency": 115.0},
    ("auth-service", "cache-service"): {"call_count": 11000.0, "error_rate": 0.001, "avg_latency": 8.0},
    ("cart-service", "product-service"): {"call_count": 6400.0, "error_rate": 0.003, "avg_latency": 120.0},
    ("cart-service", "pricing-service"): {"call_count": 5100.0, "error_rate": 0.002, "avg_latency": 85.0},
    ("cart-service", "inventory-service"): {"call_count": 4300.0, "error_rate": 0.004, "avg_latency": 160.0},
    ("cart-service", "coupon-service"): {"call_count": 2200.0, "error_rate": 0.003, "avg_latency": 90.0},
    ("product-service", "search-service"): {"call_count": 8800.0, "error_rate": 0.002, "avg_latency": 100.0},
    ("product-service", "image-processor"): {"call_count": 1700.0, "error_rate": 0.006, "avg_latency": 360.0},
    ("product-service", "file-storage-service"): {"call_count": 2900.0, "error_rate": 0.004, "avg_latency": 230.0},
    ("product-service", "review-service"): {"call_count": 2600.0, "error_rate": 0.002, "avg_latency": 95.0},
    ("product-service", "cache-service"): {"call_count": 9500.0, "error_rate": 0.001, "avg_latency": 10.0},
    ("search-service", "product-service"): {"call_count": 4100.0, "error_rate": 0.003, "avg_latency": 120.0},
    ("search-service", "cache-service"): {"call_count": 4600.0, "error_rate": 0.001, "avg_latency": 8.0},
    ("recommendation-engine", "product-service"): {"call_count": 3800.0, "error_rate": 0.003, "avg_latency": 125.0},
    ("recommendation-engine", "user-service"): {"call_count": 3200.0, "error_rate": 0.003, "avg_latency": 110.0},
    ("recommendation-engine", "cache-service"): {"call_count": 4100.0, "error_rate": 0.001, "avg_latency": 9.0},
    ("shipping-service", "notification-service"): {"call_count": 3400.0, "error_rate": 0.002, "avg_latency": 80.0},
    ("shipping-service", "email-service"): {"call_count": 2800.0, "error_rate": 0.002, "avg_latency": 78.0},
    ("shipping-service", "tax-service"): {"call_count": 2500.0, "error_rate": 0.003, "avg_latency": 125.0},
    ("notification-service", "email-service"): {"call_count": 1400.0, "error_rate": 0.002, "avg_latency": 80.0},
    ("notification-service", "sms-service"): {"call_count": 800.0, "error_rate": 0.001, "avg_latency": 65.0},
    ("notification-service", "message-queue-consumer"): {"call_count": 2900.0, "error_rate": 0.007, "avg_latency": 190.0},
    ("payment-gateway", "audit-log-service"): {"call_count": 7200.0, "error_rate": 0.001, "avg_latency": 50.0},
    ("fraud-detection", "audit-log-service"): {"call_count": 6900.0, "error_rate": 0.001, "avg_latency": 48.0},
    ("fraud-detection", "user-service"): {"call_count": 5100.0, "error_rate": 0.003, "avg_latency": 108.0},
    ("analytics-service", "product-service"): {"call_count": 1800.0, "error_rate": 0.003, "avg_latency": 130.0},
    ("analytics-service", "user-service"): {"call_count": 1500.0, "error_rate": 0.003, "avg_latency": 110.0},
    ("analytics-service", "order-api"): {"call_count": 1200.0, "error_rate": 0.008, "avg_latency": 250.0},
    ("report-service", "analytics-service"): {"call_count": 1600.0, "error_rate": 0.002, "avg_latency": 140.0},
    ("report-service", "file-storage-service"): {"call_count": 1100.0, "error_rate": 0.004, "avg_latency": 220.0},
    ("audit-log-service", "message-queue-consumer"): {"call_count": 6800.0, "error_rate": 0.007, "avg_latency": 185.0},
    ("config-service", "cache-service"): {"call_count": 4000.0, "error_rate": 0.001, "avg_latency": 8.0},
    ("coupon-service", "pricing-service"): {"call_count": 2000.0, "error_rate": 0.002, "avg_latency": 85.0},
    ("wishlist-service", "product-service"): {"call_count": 1500.0, "error_rate": 0.002, "avg_latency": 95.0},
    ("wishlist-service", "user-service"): {"call_count": 1300.0, "error_rate": 0.003, "avg_latency": 105.0},
    ("review-service", "user-service"): {"call_count": 2700.0, "error_rate": 0.003, "avg_latency": 108.0},
    ("review-service", "notification-service"): {"call_count": 1200.0, "error_rate": 0.002, "avg_latency": 78.0},
    ("tax-service", "audit-log-service"): {"call_count": 2300.0, "error_rate": 0.001, "avg_latency": 50.0},
    ("scheduler-service", "analytics-service"): {"call_count": 700.0, "error_rate": 0.002, "avg_latency": 145.0},
    ("scheduler-service", "message-queue-consumer"): {"call_count": 600.0, "error_rate": 0.007, "avg_latency": 195.0},
    ("health-check-service", "gateway"): {"call_count": 14000.0, "error_rate": 0.0, "avg_latency": 4.0},
    ("health-check-service", "cache-service"): {"call_count": 14000.0, "error_rate": 0.0, "avg_latency": 3.0},
    ("message-queue-consumer", "notification-service"): {"call_count": 5500.0, "error_rate": 0.002, "avg_latency": 82.0},
    ("message-queue-consumer", "email-service"): {"call_count": 4800.0, "error_rate": 0.002, "avg_latency": 76.0},
    ("image-processor", "file-storage-service"): {"call_count": 1600.0, "error_rate": 0.004, "avg_latency": 225.0},
    ("image-processor", "cache-service"): {"call_count": 1800.0, "error_rate": 0.001, "avg_latency": 10.0},
    ("loyalty-service", "user-service"): {"call_count": 2000.0, "error_rate": 0.003, "avg_latency": 108.0},
    ("loyalty-service", "notification-service"): {"call_count": 900.0, "error_rate": 0.002, "avg_latency": 75.0},
}

DEFAULT_EDGE_METRICS = {"call_count": 100.0, "error_rate": 0.005, "avg_latency": 80.0}


def _generate_mock_timeseries(service: str, metric_type: str, start: float, end: float, step: int) -> list[TimeSeriesPoint]:
    rng = random.Random(hash(service + metric_type))
    base_values = {"request_count": 200.0, "error_rate": 0.01, "p99_latency": 150.0}
    base = base_values.get(metric_type, 100.0)
    anomaly_services = {"order-api", "payment-service"}
    points: list[TimeSeriesPoint] = []
    ts = start
    spike_start = start + (end - start) * 0.6
    spike_end = start + (end - start) * 0.85
    while ts <= end:
        noise = rng.gauss(0, base * 0.1)
        value = base + noise
        if service in anomaly_services and spike_start <= ts <= spike_end:
            spike_factor = 6.0 if metric_type == "error_rate" else 3.0 if metric_type == "p99_latency" else 1.5
            value = base * spike_factor + rng.gauss(0, base * 0.2)
        value = max(0.0, value)
        if metric_type == "error_rate":
            value = min(value, 1.0)
        points.append(TimeSeriesPoint(timestamp=ts, value=round(value, 4)))
        ts += step
    return points


class PrometheusClient:
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(timeout=15.0)
        self._available: bool | None = None

    async def _check_available(self) -> bool:
        if self._available is not None:
            return self._available
        try:
            resp = await self.client.get(f"{PROMETHEUS_URL}/api/v1/status/config")
            self._available = resp.status_code == 200
        except Exception:
            self._available = False
            logger.warning("Prometheus unreachable, using mock data")
        return self._available

    async def query_range(self, expr: str, start: float, end: float, step: str = "60s") -> dict:
        available = await self._check_available()
        if not available:
            return {"status": "success", "data": {"resultType": "matrix", "result": []}}
        params = {"query": expr, "start": str(start), "end": str(end), "step": step}
        resp = await self.client.get(f"{PROMETHEUS_URL}/api/v1/query_range", params=params)
        resp.raise_for_status()
        return resp.json()

    async def get_service_request_count(self, service: str, start: float, end: float) -> float:
        available = await self._check_available()
        if not available:
            return MOCK_SERVICE_METRICS.get(service, DEFAULT_MOCK_METRICS)["request_count"]
        expr = f'sum(rate(http_requests_total{{service="{service}"}}[5m]))'
        result = await self.query_range(expr, start, end)
        try:
            values = result["data"]["result"][0]["values"]
            return float(values[-1][1]) if values else 0.0
        except (KeyError, IndexError):
            return 0.0

    async def get_service_error_rate(self, service: str, start: float, end: float) -> float:
        available = await self._check_available()
        if not available:
            return MOCK_SERVICE_METRICS.get(service, DEFAULT_MOCK_METRICS)["error_rate"]
        expr = f'sum(rate(http_requests_total{{service="{service}",code=~"5.."}}[5m])) / sum(rate(http_requests_total{{service="{service}"}}[5m]))'
        result = await self.query_range(expr, start, end)
        try:
            values = result["data"]["result"][0]["values"]
            return float(values[-1][1]) if values else 0.0
        except (KeyError, IndexError):
            return 0.0

    async def get_service_p99_latency(self, service: str, start: float, end: float) -> float:
        available = await self._check_available()
        if not available:
            return MOCK_SERVICE_METRICS.get(service, DEFAULT_MOCK_METRICS)["p99_latency"]
        expr = f'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{{service="{service}"}}[5m])) by (le))'
        result = await self.query_range(expr, start, end)
        try:
            values = result["data"]["result"][0]["values"]
            return float(values[-1][1]) * 1000 if values else 0.0
        except (KeyError, IndexError):
            return 0.0

    async def get_call_metrics(self, source: str, target: str, start: float, end: float) -> dict:
        available = await self._check_available()
        if not available:
            return MOCK_EDGE_METRICS.get((source, target), DEFAULT_EDGE_METRICS)
        expr = f'sum(rate(http_requests_total{{source="{source}",target="{target}"}}[5m]))'
        result = await self.query_range(expr, start, end)
        call_count = 0.0
        try:
            values = result["data"]["result"][0]["values"]
            call_count = float(values[-1][1]) if values else 0.0
        except (KeyError, IndexError):
            pass
        err_expr = f'sum(rate(http_requests_total{{source="{source}",target="{target}",code=~"5.."}}[5m])) / sum(rate(http_requests_total{{source="{source}",target="{target}"}}[5m]))'
        err_result = await self.query_range(err_expr, start, end)
        error_rate = 0.0
        try:
            values = err_result["data"]["result"][0]["values"]
            error_rate = float(values[-1][1]) if values else 0.0
        except (KeyError, IndexError):
            pass
        lat_expr = f'sum(rate(http_request_duration_seconds_sum{{source="{source}",target="{target}"}}[5m])) / sum(rate(http_request_duration_seconds_count{{source="{source}",target="{target}"}}[5m]))'
        lat_result = await self.query_range(lat_expr, start, end)
        avg_latency = 0.0
        try:
            values = lat_result["data"]["result"][0]["values"]
            avg_latency = float(values[-1][1]) * 1000 if values else 0.0
        except (KeyError, IndexError):
            pass
        return {"call_count": call_count, "error_rate": error_rate, "avg_latency": avg_latency}

    async def get_timeseries(self, services: list[str], metric_type: str, start: float, end: float, step: int = 60) -> list[MetricSeries]:
        available = await self._check_available()
        result: list[MetricSeries] = []
        for svc in services:
            if not available:
                points = _generate_mock_timeseries(svc, metric_type, start, end, step)
                result.append(MetricSeries(service_name=svc, metric_type=metric_type, data_points=points))
                continue
            expr_map = {
                "request_count": f'sum(rate(http_requests_total{{service="{svc}"}}[5m]))',
                "error_rate": f'sum(rate(http_requests_total{{service="{svc}",code=~"5.."}}[5m])) / sum(rate(http_requests_total{{service="{svc}"}}[5m]))',
                "p99_latency": f'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{{service="{svc}"}}[5m])) by (le))',
            }
            expr = expr_map.get(metric_type, f'sum(rate(http_requests_total{{service="{svc}"}}[5m]))')
            raw = await self.query_range(expr, start, end, step=f"{step}s")
            points: list[TimeSeriesPoint] = []
            try:
                for val_pair in raw["data"]["result"][0]["values"]:
                    ts_val = float(val_pair[0])
                    v = float(val_pair[1])
                    if metric_type == "p99_latency":
                        v *= 1000
                    points.append(TimeSeriesPoint(timestamp=ts_val, value=round(v, 4)))
            except (KeyError, IndexError):
                points = _generate_mock_timeseries(svc, metric_type, start, end, step)
            result.append(MetricSeries(service_name=svc, metric_type=metric_type, data_points=points))
        return result

    async def close(self) -> None:
        await self.client.aclose()
