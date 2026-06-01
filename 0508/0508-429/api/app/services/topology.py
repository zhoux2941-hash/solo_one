from app.config import ERROR_RATE_ERROR, ERROR_RATE_WARNING, LATENCY_ERROR_MS, LATENCY_WARNING_MS
from app.models.schemas import (
    Service,
    ServiceMetrics,
    TopologyData,
    TopologyEdge,
    TopologyNode,
)
from app.services.prometheus_client import PrometheusClient, MOCK_EDGE_METRICS


def _determine_node_status(metrics: ServiceMetrics) -> str:
    if metrics.error_rate >= ERROR_RATE_ERROR or metrics.p99_latency >= LATENCY_ERROR_MS:
        return "error"
    if metrics.error_rate >= ERROR_RATE_WARNING or metrics.p99_latency >= LATENCY_WARNING_MS:
        return "warning"
    return "healthy"


def _determine_edge_health(error_rate: float) -> str:
    if error_rate >= ERROR_RATE_ERROR:
        return "error"
    if error_rate >= ERROR_RATE_WARNING:
        return "warning"
    return "healthy"


class TopologyBuilder:
    def __init__(self, prometheus_client: PrometheusClient) -> None:
        self.prometheus = prometheus_client

    async def build_topology(self, services: list[Service], start: float, end: float) -> TopologyData:
        service_names = {s.name for s in services}
        nodes: list[TopologyNode] = []
        for svc in services:
            request_count = await self.prometheus.get_service_request_count(svc.name, start, end)
            error_rate = await self.prometheus.get_service_error_rate(svc.name, start, end)
            p99_latency = await self.prometheus.get_service_p99_latency(svc.name, start, end)
            metrics = ServiceMetrics(request_count=request_count, error_rate=error_rate, p99_latency=p99_latency)
            status = _determine_node_status(metrics)
            nodes.append(TopologyNode(id=svc.name, name=svc.name, status=status, metrics=metrics))

        edges: list[TopologyEdge] = []
        edge_pairs: list[tuple[str, str]] = []
        for (source, target) in MOCK_EDGE_METRICS.keys():
            if source in service_names and target in service_names:
                edge_pairs.append((source, target))

        for source, target in edge_pairs:
            call_data = await self.prometheus.get_call_metrics(source, target, start, end)
            call_count = call_data["call_count"]
            error_rate = call_data["error_rate"]
            avg_latency = call_data["avg_latency"]
            health = _determine_edge_health(error_rate)
            edges.append(
                TopologyEdge(
                    source=source,
                    target=target,
                    call_count=call_count,
                    error_rate=error_rate,
                    avg_latency=avg_latency,
                    health=health,
                )
            )

        return TopologyData(nodes=nodes, edges=edges)
