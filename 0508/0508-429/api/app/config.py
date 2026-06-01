import os

PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://localhost:9090")
K8S_API_URL = os.getenv("K8S_API_URL", "http://localhost:8080")
CONSUL_URL = os.getenv("CONSUL_URL", "http://localhost:8500")
ARGOCD_URL = os.getenv("ARGOCD_URL", "http://localhost:8081")
FLUXCD_URL = os.getenv("FLUXCD_URL", "http://localhost:8082")
LH2_URL = os.getenv("LH2_URL", "http://localhost:8083")

ERROR_RATE_WARNING = 0.01
ERROR_RATE_ERROR = 0.05
LATENCY_WARNING_MS = 500.0
LATENCY_ERROR_MS = 1000.0
