import logging

import httpx

from app.config import ARGOCD_URL, FLUXCD_URL
from app.models.schemas import ChangeEvent

logger = logging.getLogger(__name__)

MOCK_ARGOCD_EVENTS = [
    ChangeEvent(
        service_name="order-api",
        event_type="deployment",
        source="argocd",
        timestamp="2026-06-02T14:23:00Z",
        details={"image": "order-api:v2.3.1", "revision": "a1b2c3d", "author": "zhangsan", "message": "feat: 新增支付回调处理逻辑"},
    ),
    ChangeEvent(
        service_name="order-api",
        event_type="rollback",
        source="argocd",
        timestamp="2026-06-02T15:10:00Z",
        details={"image": "order-api:v2.3.0", "revision": "e5f6g7h", "author": "lisi", "message": "fix: 回滚至稳定版本"},
    ),
    ChangeEvent(
        service_name="inventory-service",
        event_type="deployment",
        source="argocd",
        timestamp="2026-06-01T09:00:00Z",
        details={"image": "inventory-service:v2.0.5", "revision": "i8j9k0l", "author": "wangwu", "message": "chore: 更新依赖版本"},
    ),
]

MOCK_FLUXCD_EVENTS = [
    ChangeEvent(
        service_name="notification-service",
        event_type="deployment",
        source="fluxcd",
        timestamp="2026-06-01T11:30:00Z",
        details={"image": "notification-service:v1.5.3", "revision": "m1n2o3p", "author": "zhaoliu", "message": "fix: 修复消息模板渲染问题"},
    ),
    ChangeEvent(
        service_name="auth-service",
        event_type="config_change",
        source="fluxcd",
        timestamp="2026-06-02T08:00:00Z",
        details={"configmap": "auth-config", "change": "token_expiry: 3600 -> 7200", "author": "qianqi"},
    ),
]


class CDIntegration:
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(timeout=10.0)

    async def get_argocd_events(self, service_name: str, start: str, end: str) -> list[ChangeEvent]:
        try:
            resp = await self.client.get(f"{ARGOCD_URL}/api/v1/applications")
            resp.raise_for_status()
            apps = resp.json().get("items", [])
            events: list[ChangeEvent] = []
            for app in apps:
                name = app.get("metadata", {}).get("labels", {}).get("app", "")
                if service_name and name != service_name:
                    continue
                status = app.get("status", {})
                history = status.get("history", [])
                for entry in history:
                    ts = entry.get("deployedAt", "")
                    if start <= ts <= end:
                        events.append(
                            ChangeEvent(
                                service_name=name,
                                event_type="deployment",
                                source="argocd",
                                timestamp=ts,
                                details={
                                    "image": entry.get("image", ""),
                                    "revision": entry.get("revision", ""),
                                },
                            )
                        )
            return events
        except Exception:
            logger.warning("ArgoCD API unreachable, using mock data")
            return [e for e in MOCK_ARGOCD_EVENTS if not service_name or e.service_name == service_name]

    async def get_fluxcd_events(self, service_name: str, start: str, end: str) -> list[ChangeEvent]:
        try:
            ns = "default"
            resp = await self.client.get(f"{FLUXCD_URL}/api/v1/namespaces/{ns}/revisions")
            resp.raise_for_status()
            revisions = resp.json().get("items", [])
            events: list[ChangeEvent] = []
            for rev in revisions:
                name = rev.get("metadata", {}).get("labels", {}).get("app", "")
                if service_name and name != service_name:
                    continue
                ts = rev.get("metadata", {}).get("creationTimestamp", "")
                if start <= ts <= end:
                    events.append(
                        ChangeEvent(
                            service_name=name,
                            event_type=rev.get("spec", {}).get("type", "deployment"),
                            source="fluxcd",
                            timestamp=ts,
                            details=rev.get("spec", {}).get("details", {}),
                        )
                    )
            return events
        except Exception:
            logger.warning("FluxCD API unreachable, using mock data")
            return [e for e in MOCK_FLUXCD_EVENTS if not service_name or e.service_name == service_name]

    async def get_change_events(self, service_name: str, start: str, end: str) -> list[ChangeEvent]:
        argocd = await self.get_argocd_events(service_name, start, end)
        fluxcd = await self.get_fluxcd_events(service_name, start, end)
        all_events = argocd + fluxcd
        all_events.sort(key=lambda e: e.timestamp)
        return all_events

    async def close(self) -> None:
        await self.client.aclose()
