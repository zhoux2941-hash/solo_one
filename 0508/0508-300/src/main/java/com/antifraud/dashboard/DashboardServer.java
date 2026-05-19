package com.antifraud.dashboard;

import com.antifraud.graph.AnomalySubgraphDetector;
import com.antifraud.graph.GraphMetricsCalculator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import spark.Spark;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicReference;

public class DashboardServer {
    private static final Logger LOG = LoggerFactory.getLogger(DashboardServer.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final Queue<Map<String, Object>> recentAlerts = new ConcurrentLinkedQueue<>();
    private static final Map<String, Integer> ruleHitCount = new HashMap<>();
    private static final Map<String, Long> alertLevelCount = new HashMap<>();

    private static final List<AnomalySubgraphDetector.SubgraphAlert> recentSubgraphAlerts =
            Collections.synchronizedList(new ArrayList<>());

    private static final AtomicReference<GraphMetricsCalculator.GraphMetricsSnapshot> currentGraphMetrics =
            new AtomicReference<>();

    private static final Map<String, Integer> subgraphAlertTypeCount = new HashMap<>();

    public DashboardServer(int port) {
        Spark.port(port);
        setupRoutes();
        initializeStats();
    }

    private void setupRoutes() {
        Spark.staticFiles.location("/dashboard");

        Spark.get("/api/alerts", (req, res) -> {
            res.type("application/json");
            int limit = Integer.parseInt(req.queryParamOrDefault("limit", "50"));
            List<Map<String, Object>> alerts = new ArrayList<>(recentAlerts);
            return objectMapper.writeValueAsString(alerts.subList(0, Math.min(limit, alerts.size())));
        });

        Spark.get("/api/stats", (req, res) -> {
            res.type("application/json");
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalAlerts", recentAlerts.size());
            stats.put("ruleHitCount", ruleHitCount);
            stats.put("alertLevelCount", alertLevelCount);
            stats.put("timestamp", System.currentTimeMillis());
            return objectMapper.writeValueAsString(stats);
        });

        Spark.get("/api/graph/metrics", (req, res) -> {
            res.type("application/json");
            GraphMetricsCalculator.GraphMetricsSnapshot snapshot = currentGraphMetrics.get();
            if (snapshot != null) {
                Map<String, Object> metrics = new HashMap<>();
                metrics.put("globalMetrics", convertGlobalMetricsToMap(snapshot.getGlobalMetrics()));
                metrics.put("topNodesByPageRank", convertNodeMetricsMap(snapshot.getTopNodesByPageRank()));
                metrics.put("topNodesByBetweenness", convertNodeMetricsMap(snapshot.getTopNodesByBetweenness()));
                metrics.put("snapshotTime", snapshot.getSnapshotTime());
                return objectMapper.writeValueAsString(metrics);
            } else {
                Map<String, Object> empty = new HashMap<>();
                empty.put("message", "No graph metrics available yet");
                empty.put("timestamp", System.currentTimeMillis());
                return objectMapper.writeValueAsString(empty);
            }
        });

        Spark.get("/api/graph/subgraph-alerts", (req, res) -> {
            res.type("application/json");
            int limit = Integer.parseInt(req.queryParamOrDefault("limit", "20"));
            List<AnomalySubgraphDetector.SubgraphAlert> alerts;
            synchronized (recentSubgraphAlerts) {
                alerts = new ArrayList<>(recentSubgraphAlerts);
            }
            if (alerts.size() > limit) {
                alerts = alerts.subList(alerts.size() - limit, alerts.size());
            }
            Collections.reverse(alerts);
            return objectMapper.writeValueAsString(alerts);
        });

        Spark.get("/api/graph/subgraph-stats", (req, res) -> {
            res.type("application/json");
            Map<String, Object> stats = new HashMap<>();
            stats.put("subgraphAlertTypeCount", new HashMap<>(subgraphAlertTypeCount));
            stats.put("totalSubgraphAlerts", recentSubgraphAlerts.size());
            stats.put("timestamp", System.currentTimeMillis());
            return objectMapper.writeValueAsString(stats);
        });

        Spark.get("/api/health", (req, res) -> {
            res.type("application/json");
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("timestamp", System.currentTimeMillis());
            return objectMapper.writeValueAsString(health);
        });

        Spark.webSocket("/ws/alerts", AlertWebSocketHandler.class);

        LOG.info("Dashboard routes configured");
    }

    private Map<String, Object> convertGlobalMetricsToMap(GraphMetricsCalculator.GlobalGraphMetrics globalMetrics) {
        if (globalMetrics == null) {
            return new HashMap<>();
        }
        Map<String, Object> map = new HashMap<>();
        map.put("totalNodes", globalMetrics.getTotalNodes());
        map.put("totalEdges", globalMetrics.getTotalEdges());
        map.put("averageDegree", globalMetrics.getAverageDegree());
        map.put("graphDensity", globalMetrics.getGraphDensity());
        map.put("maxDegreeCentrality", globalMetrics.getMaxDegreeCentrality());
        map.put("maxPageRank", globalMetrics.getMaxPageRank());
        map.put("calculationTime", globalMetrics.getCalculationTime());
        map.put("totalAlerts", globalMetrics.totalAlerts);
        map.put("cycleCount", globalMetrics.cycleCount);
        map.put("denseSubgraphCount", globalMetrics.denseSubgraphCount);
        map.put("moneyLaunderingPatternCount", globalMetrics.moneyLaunderingPatternCount);
        map.put("structuringPatternCount", globalMetrics.structuringPatternCount);
        return map;
    }

    private Map<String, Map<String, Object>> convertNodeMetricsMap(Map<String, GraphMetricsCalculator.NodeMetrics> nodeMetricsMap) {
        if (nodeMetricsMap == null) {
            return new HashMap<>();
        }
        Map<String, Map<String, Object>> result = new HashMap<>();
        for (Map.Entry<String, GraphMetricsCalculator.NodeMetrics> entry : nodeMetricsMap.entrySet()) {
            result.put(entry.getKey(), convertNodeMetricsToMap(entry.getValue()));
        }
        return result;
    }

    private Map<String, Object> convertNodeMetricsToMap(GraphMetricsCalculator.NodeMetrics nodeMetrics) {
        if (nodeMetrics == null) {
            return new HashMap<>();
        }
        Map<String, Object> map = new HashMap<>();
        map.put("accountId", nodeMetrics.getAccountId());
        map.put("inDegree", nodeMetrics.getInDegree());
        map.put("outDegree", nodeMetrics.getOutDegree());
        map.put("degree", nodeMetrics.getDegree());
        map.put("neighborCount", nodeMetrics.getNeighborCount());
        map.put("degreeCentrality", nodeMetrics.getDegreeCentrality());
        map.put("betweennessCentrality", nodeMetrics.getBetweennessCentrality());
        map.put("closenessCentrality", nodeMetrics.getClosenessCentrality());
        map.put("clusteringCoefficient", nodeMetrics.getClusteringCoefficient());
        map.put("egoNetworkDensity", nodeMetrics.getEgoNetworkDensity());
        map.put("pagerank", nodeMetrics.getPagerank());
        map.put("transactionVelocity", nodeMetrics.getTransactionVelocity());
        map.put("flowBalance", nodeMetrics.getFlowBalance());
        map.put("lastCalculatedTime", nodeMetrics.getLastCalculatedTime());
        return map;
    }

    private void initializeStats() {
        alertLevelCount.put("LOW", 0L);
        alertLevelCount.put("MEDIUM", 0L);
        alertLevelCount.put("HIGH", 0L);
        alertLevelCount.put("CRITICAL", 0L);

        subgraphAlertTypeCount.put("CYCLE_DETECTED", 0);
        subgraphAlertTypeCount.put("DENSE_SUBGRAPH", 0);
        subgraphAlertTypeCount.put("MONEY_LAUNDERING_PATTERN", 0);
        subgraphAlertTypeCount.put("STRUCTURING_PATTERN", 0);
    }

    public static void addAlert(Map<String, Object> alert) {
        recentAlerts.offer(alert);
        if (recentAlerts.size() > 1000) {
            recentAlerts.poll();
        }

        String ruleId = (String) alert.get("ruleId");
        ruleHitCount.merge(ruleId, 1, Integer::sum);

        String alertLevel = (String) alert.get("alertLevel");
        alertLevelCount.merge(alertLevel, 1L, Long::sum);

        AlertWebSocketHandler.broadcastAlert(alert);
    }

    public static void addSubgraphAlert(AnomalySubgraphDetector.SubgraphAlert alert) {
        synchronized (recentSubgraphAlerts) {
            recentSubgraphAlerts.add(alert);
            if (recentSubgraphAlerts.size() > 100) {
                recentSubgraphAlerts.remove(0);
            }
        }

        if (alert.getAlertType() != null) {
            String typeName = alert.getAlertType().name();
            synchronized (subgraphAlertTypeCount) {
                subgraphAlertTypeCount.merge(typeName, 1, Integer::sum);
            }
        }

        Map<String, Object> alertMap = new HashMap<>();
        alertMap.put("alertId", alert.getAlertId());
        alertMap.put("alertType", alert.getAlertType() != null ? alert.getAlertType().name() : "UNKNOWN");
        alertMap.put("alertLevel", alert.getAlertLevel() != null ? alert.getAlertLevel().name() : "MEDIUM");
        alertMap.put("timestamp", alert.getTimestamp());
        alertMap.put("description", alert.getDescription());
        alertMap.put("affectedAccounts", alert.getAffectedAccounts());
        alertMap.put("confidence", alert.getConfidence());
        alertMap.put("isSubgraphAlert", true);

        if (alert.getCycleLength() != null) alertMap.put("cycleLength", alert.getCycleLength());
        if (alert.getSubgraphSize() != null) alertMap.put("subgraphSize", alert.getSubgraphSize());
        if (alert.getLayerCount() != null) alertMap.put("layerCount", alert.getLayerCount());
        if (alert.getDensity() != null) alertMap.put("density", alert.getDensity());
        if (alert.getTurnoverRatio() != null) alertMap.put("turnoverRatio", alert.getTurnoverRatio());
        if (alert.getTotalVolume() != null) alertMap.put("totalVolume", alert.getTotalVolume().doubleValue());

        AlertWebSocketHandler.broadcastAlert(alertMap);
    }

    public static void updateGraphMetrics(GraphMetricsCalculator.GraphMetricsSnapshot snapshot) {
        currentGraphMetrics.set(snapshot);
        LOG.info("Updated graph metrics snapshot: {} nodes, {} edges",
                snapshot.getGlobalMetrics() != null ? snapshot.getGlobalMetrics().getTotalNodes() : 0,
                snapshot.getGlobalMetrics() != null ? snapshot.getGlobalMetrics().getTotalEdges() : 0);

        Map<String, Object> metricsUpdate = new HashMap<>();
        metricsUpdate.put("type", "graphMetricsUpdate");
        metricsUpdate.put("timestamp", System.currentTimeMillis());
        metricsUpdate.put("globalMetrics", convertGlobalMetricsToMap(snapshot.getGlobalMetrics()));
        AlertWebSocketHandler.broadcastAlert(metricsUpdate);
    }

    public void start() {
        Spark.init();
        LOG.info("Dashboard server started on port {}", Spark.port());
    }

    public void stop() {
        Spark.stop();
        LOG.info("Dashboard server stopped");
    }
}
