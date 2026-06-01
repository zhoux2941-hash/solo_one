import logging

import httpx

from app.config import CONSUL_URL, K8S_API_URL
from app.models.schemas import Service, ServiceInstance

logger = logging.getLogger(__name__)

MOCK_SERVICES: list[Service] = [
    Service(name="gateway", source="kubernetes", version="v4.2.0", instances=[
        ServiceInstance(name="gateway-6c7d8e-g1h2", address="10.244.0.5", port=8000, status="Running", restart_count=0, labels={"app": "gateway", "version": "v4.2.0"}),
        ServiceInstance(name="gateway-6c7d8e-i3j4", address="10.244.0.6", port=8000, status="Running", restart_count=0, labels={"app": "gateway", "version": "v4.2.0"}),
        ServiceInstance(name="gateway-6c7d8e-k5l6", address="10.244.0.7", port=8000, status="Running", restart_count=0, labels={"app": "gateway", "version": "v4.2.0"}),
    ]),
    Service(name="auth-service", source="kubernetes", version="v2.1.0", instances=[
        ServiceInstance(name="auth-service-3e4f5a-m7n8", address="10.244.1.50", port=8085, status="Running", restart_count=0, labels={"app": "auth-service", "version": "v2.1.0"}),
    ]),
    Service(name="order-api", source="kubernetes", version="v2.3.1", instances=[
        ServiceInstance(name="order-api-7b8f9c-x2k4", address="10.244.1.23", port=8080, status="Running", restart_count=3, labels={"app": "order-api", "version": "v2.3.1"}),
        ServiceInstance(name="order-api-7b8f9c-m5n7", address="10.244.1.24", port=8080, status="Running", restart_count=1, labels={"app": "order-api", "version": "v2.3.1"}),
        ServiceInstance(name="order-api-7b8f9c-p9q2", address="10.244.2.11", port=8080, status="CrashLoopBackOff", restart_count=7, labels={"app": "order-api", "version": "v2.3.1"}),
    ]),
    Service(name="payment-service", source="kubernetes", version="v1.8.0", instances=[
        ServiceInstance(name="payment-service-5d4e6f-a1b2", address="10.244.1.30", port=8081, status="Running", restart_count=0, labels={"app": "payment-service", "version": "v1.8.0"}),
        ServiceInstance(name="payment-service-5d4e6f-c3d4", address="10.244.2.15", port=8081, status="Running", restart_count=0, labels={"app": "payment-service", "version": "v1.8.0"}),
    ]),
    Service(name="user-service", source="kubernetes", version="v3.1.2", instances=[
        ServiceInstance(name="user-service-9a1b2c-e5f6", address="10.244.1.40", port=8082, status="Running", restart_count=0, labels={"app": "user-service", "version": "v3.1.2"}),
    ]),
    Service(name="inventory-service", source="consul", version="v2.0.5", instances=[
        ServiceInstance(name="inventory-service-node1", address="10.244.3.10", port=8083, status="passing", restart_count=0, labels={"app": "inventory-service", "version": "v2.0.5"}),
        ServiceInstance(name="inventory-service-node2", address="10.244.3.11", port=8083, status="passing", restart_count=0, labels={"app": "inventory-service", "version": "v2.0.5"}),
    ]),
    Service(name="notification-service", source="consul", version="v1.5.3", instances=[
        ServiceInstance(name="notification-service-node1", address="10.244.3.20", port=8084, status="passing", restart_count=0, labels={"app": "notification-service", "version": "v1.5.3"}),
    ]),
    Service(name="cart-service", source="kubernetes", version="v1.3.0", instances=[
        ServiceInstance(name="cart-service-a1b2c3-d4e5", address="10.244.1.60", port=8086, status="Running", restart_count=0, labels={"app": "cart-service", "version": "v1.3.0"}),
    ]),
    Service(name="product-service", source="kubernetes", version="v2.5.1", instances=[
        ServiceInstance(name="product-service-f1g2h3-i4j5", address="10.244.1.70", port=8087, status="Running", restart_count=0, labels={"app": "product-service", "version": "v2.5.1"}),
        ServiceInstance(name="product-service-f1g2h3-k6l7", address="10.244.2.20", port=8087, status="Running", restart_count=0, labels={"app": "product-service", "version": "v2.5.1"}),
    ]),
    Service(name="search-service", source="kubernetes", version="v1.1.4", instances=[
        ServiceInstance(name="search-service-m8n9o0-p1q2", address="10.244.1.80", port=8088, status="Running", restart_count=0, labels={"app": "search-service", "version": "v1.1.4"}),
    ]),
    Service(name="recommendation-engine", source="kubernetes", version="v3.0.2", instances=[
        ServiceInstance(name="rec-engine-r3s4t5-u6v7", address="10.244.1.90", port=8089, status="Running", restart_count=1, labels={"app": "recommendation-engine", "version": "v3.0.2"}),
    ]),
    Service(name="coupon-service", source="consul", version="v1.2.0", instances=[
        ServiceInstance(name="coupon-service-node1", address="10.244.3.30", port=8090, status="passing", restart_count=0, labels={"app": "coupon-service", "version": "v1.2.0"}),
    ]),
    Service(name="shipping-service", source="kubernetes", version="v2.1.3", instances=[
        ServiceInstance(name="shipping-service-w8x9y0-z1a2", address="10.244.1.100", port=8091, status="Running", restart_count=0, labels={"app": "shipping-service", "version": "v2.1.3"}),
    ]),
    Service(name="email-service", source="consul", version="v1.0.8", instances=[
        ServiceInstance(name="email-service-node1", address="10.244.3.40", port=8092, status="passing", restart_count=0, labels={"app": "email-service", "version": "v1.0.8"}),
    ]),
    Service(name="sms-service", source="consul", version="v1.0.5", instances=[
        ServiceInstance(name="sms-service-node1", address="10.244.3.50", port=8093, status="passing", restart_count=0, labels={"app": "sms-service", "version": "v1.0.5"}),
    ]),
    Service(name="analytics-service", source="kubernetes", version="v1.4.0", instances=[
        ServiceInstance(name="analytics-b3c4d5-e6f7", address="10.244.1.110", port=8094, status="Running", restart_count=0, labels={"app": "analytics-service", "version": "v1.4.0"}),
    ]),
    Service(name="report-service", source="kubernetes", version="v2.0.1", instances=[
        ServiceInstance(name="report-g8h9i0-j1k2", address="10.244.1.120", port=8095, status="Running", restart_count=0, labels={"app": "report-service", "version": "v2.0.1"}),
    ]),
    Service(name="audit-log-service", source="kubernetes", version="v1.1.0", instances=[
        ServiceInstance(name="audit-log-l3m4n5-o6p7", address="10.244.1.130", port=8096, status="Running", restart_count=0, labels={"app": "audit-log-service", "version": "v1.1.0"}),
    ]),
    Service(name="config-service", source="kubernetes", version="v3.2.0", instances=[
        ServiceInstance(name="config-q8r9s0-t1u2", address="10.244.1.140", port=8097, status="Running", restart_count=0, labels={"app": "config-service", "version": "v3.2.0"}),
    ]),
    Service(name="file-storage-service", source="consul", version="v1.0.3", instances=[
        ServiceInstance(name="file-storage-node1", address="10.244.3.60", port=8098, status="passing", restart_count=0, labels={"app": "file-storage-service", "version": "v1.0.3"}),
    ]),
    Service(name="image-processor", source="kubernetes", version="v1.2.1", instances=[
        ServiceInstance(name="img-proc-v3w4x5-y6z7", address="10.244.1.150", port=8099, status="Running", restart_count=0, labels={"app": "image-processor", "version": "v1.2.1"}),
    ]),
    Service(name="pricing-service", source="kubernetes", version="v1.0.7", instances=[
        ServiceInstance(name="pricing-a8b9c0-d1e2", address="10.244.1.160", port=8100, status="Running", restart_count=0, labels={"app": "pricing-service", "version": "v1.0.7"}),
    ]),
    Service(name="loyalty-service", source="consul", version="v1.3.2", instances=[
        ServiceInstance(name="loyalty-node1", address="10.244.3.70", port=8101, status="passing", restart_count=0, labels={"app": "loyalty-service", "version": "v1.3.2"}),
    ]),
    Service(name="review-service", source="kubernetes", version="v1.0.4", instances=[
        ServiceInstance(name="review-f3g4h5-i6j7", address="10.244.1.170", port=8102, status="Running", restart_count=0, labels={"app": "review-service", "version": "v1.0.4"}),
    ]),
    Service(name="wishlist-service", source="kubernetes", version="v1.0.2", instances=[
        ServiceInstance(name="wishlist-k8l9m0-n1o2", address="10.244.1.180", port=8103, status="Running", restart_count=0, labels={"app": "wishlist-service", "version": "v1.0.2"}),
    ]),
    Service(name="tax-service", source="consul", version="v1.0.1", instances=[
        ServiceInstance(name="tax-node1", address="10.244.3.80", port=8104, status="passing", restart_count=0, labels={"app": "tax-service", "version": "v1.0.1"}),
    ]),
    Service(name="payment-gateway", source="kubernetes", version="v2.3.0", instances=[
        ServiceInstance(name="pay-gw-p3q4r5-s6t7", address="10.244.1.190", port=8105, status="Running", restart_count=0, labels={"app": "payment-gateway", "version": "v2.3.0"}),
    ]),
    Service(name="fraud-detection", source="kubernetes", version="v1.5.0", instances=[
        ServiceInstance(name="fraud-u8v9w0-x1y2", address="10.244.1.200", port=8106, status="Running", restart_count=0, labels={"app": "fraud-detection", "version": "v1.5.0"}),
    ]),
    Service(name="cache-service", source="kubernetes", version="v1.0.6", instances=[
        ServiceInstance(name="cache-z3a4b5-c6d7", address="10.244.1.210", port=8107, status="Running", restart_count=0, labels={"app": "cache-service", "version": "v1.0.6"}),
    ]),
    Service(name="message-queue-consumer", source="kubernetes", version="v2.0.4", instances=[
        ServiceInstance(name="mq-consumer-e8f9g0-h1i2", address="10.244.1.220", port=8108, status="Running", restart_count=2, labels={"app": "message-queue-consumer", "version": "v2.0.4"}),
    ]),
    Service(name="scheduler-service", source="kubernetes", version="v1.1.3", instances=[
        ServiceInstance(name="scheduler-j3k4l5-m6n7", address="10.244.1.230", port=8109, status="Running", restart_count=0, labels={"app": "scheduler-service", "version": "v1.1.3"}),
    ]),
    Service(name="health-check-service", source="consul", version="v1.0.0", instances=[
        ServiceInstance(name="health-node1", address="10.244.3.90", port=8110, status="passing", restart_count=0, labels={"app": "health-check-service", "version": "v1.0.0"}),
    ]),
]


class ServiceDiscovery:
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(timeout=10.0)

    async def discover_from_kubernetes(self) -> list[Service]:
        try:
            resp = await self.client.get(f"{K8S_API_URL}/api/v1/pods")
            resp.raise_for_status()
            data = resp.json()
            services_map: dict[str, Service] = {}
            for item in data.get("items", []):
                metadata = item.get("metadata", {})
                labels = metadata.get("labels", {})
                service_name = labels.get("app", labels.get("app.kubernetes.io/name", ""))
                if not service_name:
                    continue
                status = item.get("status", {})
                phase = status.get("phase", "Unknown")
                container_statuses = status.get("containerStatuses", [])
                restart_count = sum(cs.get("restartCount", 0) for cs in container_statuses)
                instance = ServiceInstance(
                    name=metadata.get("name", ""),
                    address=status.get("podIP", ""),
                    port=8080,
                    status=phase,
                    restart_count=restart_count,
                    labels=labels,
                )
                if service_name not in services_map:
                    version = labels.get("version", "unknown")
                    services_map[service_name] = Service(name=service_name, source="kubernetes", version=version)
                services_map[service_name].instances.append(instance)
            return list(services_map.values())
        except Exception:
            logger.warning("K8S API unreachable, using mock data")
            return [s for s in MOCK_SERVICES if s.source == "kubernetes"]

    async def discover_from_consul(self) -> list[Service]:
        try:
            resp = await self.client.get(f"{CONSUL_URL}/v1/catalog/services")
            resp.raise_for_status()
            services_catalog = resp.json()
            result: list[Service] = []
            for service_name in services_catalog:
                svc_resp = await self.client.get(f"{CONSUL_URL}/v1/catalog/service/{service_name}")
                svc_resp.raise_for_status()
                svc_data = svc_resp.json()
                instances: list[ServiceInstance] = []
                for entry in svc_data:
                    instances.append(
                        ServiceInstance(
                            name=entry.get("ServiceID", ""),
                            address=entry.get("ServiceAddress", ""),
                            port=entry.get("ServicePort", 0),
                            status="passing",
                            restart_count=0,
                            labels=entry.get("ServiceMeta", {}),
                        )
                    )
                version = svc_data[0].get("ServiceMeta", {}).get("version", "unknown") if svc_data else "unknown"
                result.append(Service(name=service_name, instances=instances, source="consul", version=version))
            return result
        except Exception:
            logger.warning("Consul API unreachable, using mock data")
            return [s for s in MOCK_SERVICES if s.source == "consul"]

    async def discover_all(self) -> list[Service]:
        k8s_services = await self.discover_from_kubernetes()
        consul_services = await self.discover_from_consul()
        merged: dict[str, Service] = {}
        for svc in k8s_services + consul_services:
            if svc.name in merged:
                merged[svc.name].instances.extend(svc.instances)
            else:
                merged[svc.name] = svc.model_copy(deep=True)
        return list(merged.values())

    async def close(self) -> None:
        await self.client.aclose()
