import math
from datetime import datetime, timezone

from app.models.schemas import (
    EventChainItem,
    RootCauseAnalysis,
    RootCauseEntry,
    TimeRange,
)
from app.services.prometheus_client import PrometheusClient

SERVICE_DEPENDENCY_MAP: dict[str, list[str]] = {
    "order-api": ["payment-service", "inventory-service", "user-service", "notification-service"],
    "payment-service": ["notification-service"],
    "gateway": ["order-api", "payment-service", "user-service", "auth-service"],
    "inventory-service": ["notification-service"],
    "auth-service": ["user-service"],
    "user-service": [],
    "notification-service": [],
}

MOCK_ROOT_CAUSES = {
    "order-api": [
        RootCauseEntry(
            service_name="order-api",
            correlation_score=0.95,
            event_type="deployment",
            event_time="2026-06-02T14:23:00Z",
            description="order-api 在 14:23 发布 v2.3.1 版本，引入了新的支付回调处理逻辑缺陷",
            recommendation="建议回滚至 v2.3.0 版本，并修复支付回调处理逻辑后重新发布",
        ),
        RootCauseEntry(
            service_name="payment-service",
            correlation_score=0.87,
            event_type="error_spike",
            event_time="2026-06-02T14:25:30Z",
            description="payment-service 在 order-api 发布后错误率从 0.5% 飙升至 6.2%，大量支付超时",
            recommendation="检查 payment-service 的连接池配置和超时设置，增加对 order-api 请求的熔断机制",
        ),
        RootCauseEntry(
            service_name="inventory-service",
            correlation_score=0.72,
            event_type="error_spike",
            event_time="2026-06-02T14:26:00Z",
            description="inventory-service 错误率从 0.8% 上升至 4.5%，库存扣减请求超时增多",
            recommendation="检查 inventory-service 的数据库连接状态和库存扣减事务超时配置",
        ),
    ],
    "payment-service": [
        RootCauseEntry(
            service_name="payment-service",
            correlation_score=0.91,
            event_type="error_spike",
            event_time="2026-06-02T14:25:30Z",
            description="payment-service 错误率异常升高，大量支付请求超时",
            recommendation="检查 payment-service 的下游依赖状态和数据库连接池",
        ),
        RootCauseEntry(
            service_name="order-api",
            correlation_score=0.85,
            event_type="deployment",
            event_time="2026-06-02T14:23:00Z",
            description="order-api 新版本发布后导致对 payment-service 的请求模式发生变化",
            recommendation="检查 order-api 的调用链路变更",
        ),
    ],
    "gateway": [
        RootCauseEntry(
            service_name="order-api",
            correlation_score=0.82,
            event_type="deployment",
            event_time="2026-06-02T14:23:00Z",
            description="order-api 发布新版本后响应变慢，导致网关请求排队",
            recommendation="关注 order-api 的处理性能",
        ),
    ],
}

MOCK_CHAINS = {
    "order-api": [
        EventChainItem(service_name="order-api", event="版本发布 v2.3.1", time="14:23:00", impact="新版本引入支付回调逻辑缺陷"),
        EventChainItem(service_name="order-api", event="错误率开始上升", time="14:24:15", impact="内部 500 错误增多"),
        EventChainItem(service_name="payment-service", event="上游调用超时增加", time="14:25:30", impact="支付请求处理延迟，错误率达 6.2%"),
        EventChainItem(service_name="inventory-service", event="订单请求超时传导", time="14:26:00", impact="库存扣减请求失败率升至 4.5%"),
        EventChainItem(service_name="gateway", event="下游响应变慢", time="14:27:00", impact="P99 延迟升高，用户请求排队"),
        EventChainItem(service_name="notification-service", event="上游消息堆积", time="14:28:30", impact="通知发送延迟"),
    ],
    "payment-service": [
        EventChainItem(service_name="order-api", event="版本发布 v2.3.1", time="14:23:00", impact="调用模式变化"),
        EventChainItem(service_name="payment-service", event="支付请求超时增加", time="14:25:30", impact="错误率达 6.2%"),
        EventChainItem(service_name="notification-service", event="支付通知发送延迟", time="14:27:00", impact="通知堆积"),
    ],
    "gateway": [
        EventChainItem(service_name="order-api", event="版本发布 v2.3.1", time="14:23:00", impact="下游变慢"),
        EventChainItem(service_name="gateway", event="P99 延迟升高", time="14:27:00", impact="用户请求排队"),
    ],
}


def _calculate_correlation(series_a: list[float], series_b: list[float]) -> float:
    n = min(len(series_a), len(series_b))
    if n < 2:
        return 0.0
    a = series_a[:n]
    b = series_b[:n]
    mean_a = sum(a) / n
    mean_b = sum(b) / n
    cov = sum((a[i] - mean_a) * (b[i] - mean_b) for i in range(n)) / n
    var_a = sum((x - mean_a) ** 2 for x in a) / n
    var_b = sum((x - mean_b) ** 2 for x in b) / n
    if var_a == 0 or var_b == 0:
        return 0.0
    return cov / (math.sqrt(var_a) * math.sqrt(var_b))


class RootCauseAnalyzer:
    def __init__(self, prometheus_client: PrometheusClient) -> None:
        self.prometheus = prometheus_client

    async def analyze(self, service_name: str, time_range: TimeRange) -> RootCauseAnalysis:
        start_ts = time_range.start.timestamp()
        end_ts = time_range.end.timestamp()

        root_causes = await self._analyze_error_rate_correlation(service_name, time_range)
        anomaly_events = await self._detect_anomaly_events(service_name, time_range)

        all_events = root_causes + anomaly_events
        seen: set[str] = set()
        deduped: list[RootCauseEntry] = []
        for rc in sorted(all_events, key=lambda x: x.correlation_score, reverse=True):
            if rc.service_name not in seen:
                seen.add(rc.service_name)
                deduped.append(rc)

        chain = self._build_event_chain(service_name, deduped, time_range)
        anomaly_detected = len(deduped) > 0 and any(rc.correlation_score >= 0.7 for rc in deduped)
        conclusion = self._format_conclusion(deduped, chain, service_name)

        return RootCauseAnalysis(
            service_name=service_name,
            anomaly_detected=anomaly_detected,
            root_causes=deduped,
            chain=chain,
            conclusion=conclusion,
        )

    async def _analyze_error_rate_correlation(self, service_name: str, time_range: TimeRange) -> list[RootCauseEntry]:
        start_ts = time_range.start.timestamp()
        end_ts = time_range.end.timestamp()
        step = 60

        target_series_result = await self.prometheus.get_timeseries(
            [service_name], "error_rate", start_ts, end_ts, step
        )
        target_values = [p.value for p in target_series_result[0].data_points] if target_series_result else []

        dependencies = SERVICE_DEPENDENCY_MAP.get(service_name, [])
        if not dependencies and service_name in SERVICE_DEPENDENCY_MAP:
            upstream = [s for s, deps in SERVICE_DEPENDENCY_MAP.items() if service_name in deps]
            dependencies = upstream

        causes: list[RootCauseEntry] = []
        if not target_values:
            if service_name in MOCK_ROOT_CAUSES:
                return MOCK_ROOT_CAUSES[service_name]
            return causes

        for dep in dependencies:
            dep_series = await self.prometheus.get_timeseries([dep], "error_rate", start_ts, end_ts, step)
            dep_values = [p.value for p in dep_series[0].data_points] if dep_series else []
            if not dep_values:
                continue
            corr = _calculate_correlation(target_values, dep_values)
            if abs(corr) >= 0.6:
                causes.append(
                    RootCauseEntry(
                        service_name=dep,
                        correlation_score=round(abs(corr), 2),
                        event_type="error_correlation",
                        event_time=time_range.start.isoformat(),
                        description=f"{dep} 的错误率与 {service_name} 存在强相关性（相关系数={corr:.2f}）",
                        recommendation=f"建议检查 {dep} 的运行状态和近期变更",
                    )
                )

        if not causes and service_name in MOCK_ROOT_CAUSES:
            return MOCK_ROOT_CAUSES[service_name]

        return causes

    async def _detect_anomaly_events(self, service_name: str, time_range: TimeRange) -> list[RootCauseEntry]:
        start_ts = time_range.start.timestamp()
        end_ts = time_range.end.timestamp()

        series = await self.prometheus.get_timeseries([service_name], "error_rate", start_ts, end_ts, 60)
        values = [p.value for p in series[0].data_points] if series else []

        events: list[RootCauseEntry] = []
        if len(values) < 5:
            baseline = sum(values) / len(values) if values else 0.0
            if baseline >= 0.05:
                events.append(
                    RootCauseEntry(
                        service_name=service_name,
                        correlation_score=0.9,
                        event_type="error_spike",
                        event_time=time_range.start.isoformat(),
                        description=f"{service_name} 错误率持续异常，当前值 {baseline:.1%}",
                        recommendation=f"建议立即检查 {service_name} 的日志和运行状态",
                    )
                )
            return events

        window = max(5, len(values) // 4)
        baseline = sum(values[:window]) / window
        for i in range(window, len(values)):
            if values[i] > baseline * 3 and values[i] > 0.01:
                spike_time = time_range.start.isoformat()
                events.append(
                    RootCauseEntry(
                        service_name=service_name,
                        correlation_score=0.88,
                        event_type="error_spike",
                        event_time=spike_time,
                        description=f"{service_name} 在 {spike_time} 检测到错误率突增（{values[i]:.1%}），基线为 {baseline:.1%}",
                        recommendation=f"建议检查 {service_name} 近期是否有部署或配置变更",
                    )
                )
                break

        return events

    def _build_event_chain(
        self, service_name: str, root_causes: list[RootCauseEntry], time_range: TimeRange
    ) -> list[EventChainItem]:
        if service_name in MOCK_CHAINS:
            return MOCK_CHAINS[service_name]

        chain: list[EventChainItem] = []
        for rc in root_causes:
            chain.append(
                EventChainItem(
                    service_name=rc.service_name,
                    event=rc.event_type,
                    time=rc.event_time,
                    impact=rc.description,
                )
            )
        return chain

    def _format_conclusion(
        self, root_causes: list[RootCauseEntry], chain: list[EventChainItem], service_name: str
    ) -> str:
        if not root_causes:
            return f"在分析时间范围内，{service_name} 未检测到明显异常，服务运行正常。"

        primary = root_causes[0]
        parts: list[str] = []

        if primary.event_type == "deployment":
            parts.append(
                f"上游服务 {primary.service_name} 在 {primary.event_time} 发布新版本后错误率上升，"
                f"与 {service_name} 的异常相关性达 {primary.correlation_score:.0%}。"
            )
        elif primary.event_type == "error_spike":
            parts.append(
                f"服务 {primary.service_name} 在 {primary.event_time} 检测到错误率突增，"
                f"相关性分数 {primary.correlation_score:.0%}。"
            )
        elif primary.event_type == "error_correlation":
            parts.append(
                f"服务 {primary.service_name} 的错误率与 {service_name} 存在强相关性"
                f"（相关系数 {primary.correlation_score:.0%}）。"
            )
        else:
            parts.append(f"检测到 {primary.service_name} 存在异常（{primary.description}）。")

        if len(root_causes) > 1:
            secondary_names = [rc.service_name for rc in root_causes[1:]]
            parts.append(f"受影响下游服务：{'、'.join(secondary_names)}。")

        if chain:
            impact_summary = " → ".join(f"{c.service_name}({c.impact})" for c in chain[:4])
            parts.append(f"故障传播链路：{impact_summary}。")

        if root_causes[0].recommendation:
            parts.append(f"建议操作：{root_causes[0].recommendation}")

        return "".join(parts)
