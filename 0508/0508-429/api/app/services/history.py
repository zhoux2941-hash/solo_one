import logging
import uuid
from datetime import datetime, timezone

import httpx

from app.config import LH2_URL
from app.models.schemas import AnalysisHistoryRecord, RootCauseEntry

logger = logging.getLogger(__name__)

_in_memory_store: list[AnalysisHistoryRecord] = [
    AnalysisHistoryRecord(
        id="hist-001",
        service_name="order-api",
        conclusion="上游服务 order-api 在 14:23 发布新版本后错误率上升，导致 payment-service 和 inventory-service 出现级联故障",
        created_at="2026-06-02T15:30:00Z",
        root_causes=[
            RootCauseEntry(service_name="order-api", correlation_score=0.95, event_type="deployment", event_time="2026-06-02T14:23:00Z", description="版本发布引入缺陷", recommendation="回滚至 v2.3.0"),
            RootCauseEntry(service_name="payment-service", correlation_score=0.87, event_type="error_spike", event_time="2026-06-02T14:25:30Z", description="支付超时增加", recommendation="增加熔断机制"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-002",
        service_name="payment-service",
        conclusion="payment-service 在 order-api 发布后错误率飙升至 6.2%，主要由上游调用模式变化引起",
        created_at="2026-06-02T16:00:00Z",
        root_causes=[
            RootCauseEntry(service_name="order-api", correlation_score=0.85, event_type="deployment", event_time="2026-06-02T14:23:00Z", description="调用模式变更", recommendation="检查调用链路"),
            RootCauseEntry(service_name="payment-service", correlation_score=0.91, event_type="error_spike", event_time="2026-06-02T14:25:30Z", description="支付请求超时", recommendation="检查连接池配置"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-003",
        service_name="gateway",
        conclusion="网关延迟升高，根因为下游 order-api 服务响应变慢",
        created_at="2026-06-02T16:30:00Z",
        root_causes=[
            RootCauseEntry(service_name="order-api", correlation_score=0.82, event_type="deployment", event_time="2026-06-02T14:23:00Z", description="新版本响应慢", recommendation="回滚版本"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-004",
        service_name="inventory-service",
        conclusion="库存服务错误率达4.5%，由上游 order-api 调用量突增和重复请求引起",
        created_at="2026-06-02T16:45:00Z",
        root_causes=[
            RootCauseEntry(service_name="order-api", correlation_score=0.88, event_type="traffic_spike", event_time="2026-06-02T14:30:00Z", description="调用量突增3倍", recommendation="限制并发请求"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-005",
        service_name="fraud-detection",
        conclusion="欺诈检测服务P99延迟超阈值，上游调用模式变化导致资源竞争",
        created_at="2026-06-02T17:00:00Z",
        root_causes=[
            RootCauseEntry(service_name="payment-gateway", correlation_score=0.74, event_type="traffic_change", event_time="2026-06-02T14:28:00Z", description="支付网关调用量增加", recommendation="扩展fraud-detection实例"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-006",
        service_name="message-queue-consumer",
        conclusion="消息消费服务出现重启，消息堆积导致延迟增加",
        created_at="2026-06-02T17:15:00Z",
        root_causes=[
            RootCauseEntry(service_name="order-api", correlation_score=0.81, event_type="error_spike", event_time="2026-06-02T14:24:00Z", description="发送到队列的消息异常", recommendation="修复order-api消息发送逻辑"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-007",
        service_name="auth-service",
        conclusion="认证服务出现间歇性502错误，配置变更导致连接池设置不合理",
        created_at="2026-06-02T17:30:00Z",
        root_causes=[
            RootCauseEntry(service_name="config-service", correlation_score=0.77, event_type="config_change", event_time="2026-06-02T12:00:00Z", description="连接池配置更新", recommendation="回滚连接池配置"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-008",
        service_name="cache-service",
        conclusion="缓存命中率下降，缓存键模式变更导致频繁失效",
        created_at="2026-06-02T17:45:00Z",
        root_causes=[
            RootCauseEntry(service_name="order-api", correlation_score=0.84, event_type="version_release", event_time="2026-06-02T14:23:00Z", description="新版本缓存键逻辑变更", recommendation="修复缓存键生成逻辑"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-009",
        service_name="payment-gateway",
        conclusion="支付网关错误率上升1.2%，由第三方支付渠道不稳定导致",
        created_at="2026-06-02T18:00:00Z",
        root_causes=[
            RootCauseEntry(service_name="payment-gateway", correlation_score=0.92, event_type="external_error", event_time="2026-06-02T15:00:00Z", description="第三方渠道返回5xx", recommendation="切换备用支付渠道"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-010",
        service_name="user-service",
        conclusion="用户服务响应变慢，数据库连接池耗尽",
        created_at="2026-06-02T18:15:00Z",
        root_causes=[
            RootCauseEntry(service_name="analytics-service", correlation_score=0.72, event_type="traffic_change", event_time="2026-06-02T16:00:00Z", description="报表分析批量查询增加", recommendation="增加读副本或限制并发查询"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-011",
        service_name="product-service",
        conclusion="商品服务查询延迟升高，ES索引重建导致查询性能下降",
        created_at="2026-06-02T18:30:00Z",
        root_causes=[
            RootCauseEntry(service_name="search-service", correlation_score=0.79, event_type="config_change", event_time="2026-06-02T14:00:00Z", description="ES索引重建", recommendation="优化索引重建策略"),
        ],
    ),
    AnalysisHistoryRecord(
        id="hist-012",
        service_name="notification-service",
        conclusion="通知服务发送成功率下降，邮件服务临时不可用",
        created_at="2026-06-02T18:45:00Z",
        root_causes=[
            RootCauseEntry(service_name="email-service", correlation_score=0.90, event_type="pod_restart", event_time="2026-06-02T17:30:00Z", description="邮件服务Pod重启", recommendation="检查email-service健康状况"),
        ],
    ),
]


class HistoryStore:
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(timeout=10.0)
        self._lh2_available: bool | None = None

    async def _check_lh2(self) -> bool:
        if self._lh2_available is not None:
            return self._lh2_available
        try:
            resp = await self.client.get(f"{LH2_URL}/health")
            self._lh2_available = resp.status_code == 200
        except Exception:
            self._lh2_available = False
            logger.warning("LH2 API unreachable, using in-memory fallback")
        return self._lh2_available

    async def save_analysis(self, record: AnalysisHistoryRecord) -> AnalysisHistoryRecord:
        if not record.id:
            record.id = f"hist-{uuid.uuid4().hex[:8]}"
        if not record.created_at:
            record.created_at = datetime.now(timezone.utc).isoformat()

        lh2_ok = await self._check_lh2()
        if lh2_ok:
            try:
                resp = await self.client.post(
                    f"{LH2_URL}/api/v1/analyses",
                    json=record.model_dump(),
                )
                resp.raise_for_status()
                return record
            except Exception:
                logger.warning("Failed to save to LH2, falling back to in-memory")

        _in_memory_store.append(record)
        return record

    async def get_total_count(self) -> int:
        lh2_ok = await self._check_lh2()
        if lh2_ok:
            try:
                resp = await self.client.get(
                    f"{LH2_URL}/api/v1/analyses/count",
                )
                resp.raise_for_status()
                data = resp.json()
                return int(data.get("count", 0))
            except Exception:
                logger.warning("Failed to fetch count from LH2, falling back to in-memory")

        return len(_in_memory_store)

    async def get_history(self, limit: int = 10, offset: int = 0) -> tuple[list[AnalysisHistoryRecord], int]:
        lh2_ok = await self._check_lh2()
        if lh2_ok:
            try:
                resp = await self.client.get(
                    f"{LH2_URL}/api/v1/analyses",
                    params={"limit": limit, "offset": offset, "sort": "-created_at"},
                )
                resp.raise_for_status()
                data = resp.json()
                items = [AnalysisHistoryRecord(**item) for item in data.get("items", [])]
                total = int(data.get("total", len(items)))
                return items, total
            except Exception:
                logger.warning("Failed to fetch from LH2, falling back to in-memory")

        sorted_store = sorted(_in_memory_store, key=lambda r: r.created_at, reverse=True)
        total = len(sorted_store)
        return sorted_store[offset : offset + limit], total

    async def close(self) -> None:
        await self.client.aclose()
