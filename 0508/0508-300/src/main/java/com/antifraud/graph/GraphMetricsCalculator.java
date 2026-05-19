package com.antifraud.graph;

import org.apache.flink.api.common.state.*;
import org.apache.flink.api.common.time.Time;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.co.KeyedCoProcessFunction;
import org.apache.flink.util.Collector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.TimeUnit;

public class GraphMetricsCalculator {
    private static final Logger LOG = LoggerFactory.getLogger(GraphMetricsCalculator.class);

    public static class MetricsCalculationFunction extends KeyedCoProcessFunction<String,
            IncrementalGraphUpdater.GraphUpdateResult,
            AnomalySubgraphDetector.SubgraphAlert,
            GraphMetricsSnapshot> {

        private transient ValueState<TransactionGraph> graphState;
        private transient MapState<String, NodeMetrics> nodeMetricsState;
        private transient ValueState<GlobalGraphMetrics> globalMetricsState;
        private transient MapState<String, Double> pageRankState;

        private final long metricsUpdateInterval;
        private final double dampingFactor;
        private final int maxIterations;

        public MetricsCalculationFunction(long updateIntervalMinutes, double dampingFactor, int maxIterations) {
            this.metricsUpdateInterval = TimeUnit.MINUTES.toMillis(updateIntervalMinutes);
            this.dampingFactor = dampingFactor;
            this.maxIterations = maxIterations;
        }

        @Override
        public void open(Configuration parameters) throws Exception {
            ValueStateDescriptor<TransactionGraph> graphDescriptor =
                    new ValueStateDescriptor<>("metrics-graph", TransactionGraph.class);
            graphDescriptor.enableTimeToLive(StateTtl.newBuilder(Time.hours(24)).build());
            graphState = getRuntimeContext().getState(graphDescriptor);

            MapStateDescriptor<String, NodeMetrics> nodeMetricsDescriptor =
                    new MapStateDescriptor<>("node-metrics", String.class, NodeMetrics.class);
            nodeMetricsDescriptor.enableTimeToLive(StateTtl.newBuilder(Time.hours(24)).build());
            nodeMetricsState = getRuntimeContext().getMapState(nodeMetricsDescriptor);

            ValueStateDescriptor<GlobalGraphMetrics> globalMetricsDescriptor =
                    new ValueStateDescriptor<>("global-metrics", GlobalGraphMetrics.class);
            globalMetricsState = getRuntimeContext().getState(globalMetricsDescriptor);

            MapStateDescriptor<String, Double> pageRankDescriptor =
                    new MapStateDescriptor<>("page-rank", String.class, Double.class);
            pageRankState = getRuntimeContext().getMapState(pageRankDescriptor);
        }

        @Override
        public void processElement1(IncrementalGraphUpdater.GraphUpdateResult result,
                                    Context ctx, Collector<GraphMetricsSnapshot> out) throws Exception {
            TransactionGraph graph = graphState.value();
            if (graph == null) {
                graph = new TransactionGraph();
            }
            graph.addTransaction(result.getFromAccount(), result.getToAccount(),
                    result.getAmount(), result.getUpdateTime());
            graphState.update(graph);

            updateNodeMetrics(result.getFromAccount(), graph);
            updateNodeMetrics(result.getToAccount(), graph);

            updateGlobalMetrics(graph);

            ctx.timerService().registerProcessingTimeTimer(System.currentTimeMillis() + metricsUpdateInterval);
        }

        @Override
        public void processElement2(AnomalySubgraphDetector.SubgraphAlert alert,
                                    Context ctx, Collector<GraphMetricsSnapshot> out) throws Exception {
            GlobalGraphMetrics globalMetrics = globalMetricsState.value();
            if (globalMetrics == null) {
                globalMetrics = new GlobalGraphMetrics();
            }

            switch (alert.getAlertType()) {
                case CYCLE_DETECTED:
                    globalMetrics.cycleCount++;
                    break;
                case DENSE_SUBGRAPH:
                    globalMetrics.denseSubgraphCount++;
                    break;
                case MONEY_LAUNDERING_PATTERN:
                    globalMetrics.moneyLaunderingPatternCount++;
                    break;
                case STRUCTURING_PATTERN:
                    globalMetrics.structuringPatternCount++;
                    break;
            }
            globalMetrics.totalAlerts++;
            globalMetricsState.update(globalMetrics);
        }

        private void updateNodeMetrics(String accountId, TransactionGraph graph) throws Exception {
            TransactionGraph.AccountNode node = graph.getNode(accountId);
            if (node == null) return;

            NodeMetrics metrics = nodeMetricsState.get(accountId);
            if (metrics == null) {
                metrics = new NodeMetrics();
                metrics.setAccountId(accountId);
            }

            metrics.setInDegree(node.getInDegree());
            metrics.setOutDegree(node.getOutDegree());
            metrics.setDegree(node.getDegree());
            metrics.setTotalIncomingAmount(node.getTotalIncomingAmount());
            metrics.setTotalOutgoingAmount(node.getTotalOutgoingAmount());
            metrics.setLastActiveTime(node.getLastActiveTime());
            metrics.setNeighborCount(node.getNeighbors().size());

            metrics.setDegreeCentrality(calculateDegreeCentrality(node, graph));

            metrics.setBetweennessCentrality(calculateBetweennessCentrality(accountId, graph));

            metrics.setClosenessCentrality(calculateClosenessCentrality(accountId, graph));

            metrics.setClusteringCoefficient(calculateClusteringCoefficient(accountId, graph));

            metrics.setEgoNetworkDensity(calculateEgoNetworkDensity(accountId, graph));

            metrics.setPagerank(calculatePageRankIncremental(accountId, graph));

            metrics.setTransactionVelocity(calculateTransactionVelocity(node));

            metrics.setFlowBalance(calculateFlowBalance(node));

            metrics.setLastCalculatedTime(System.currentTimeMillis());

            nodeMetricsState.put(accountId, metrics);
        }

        private double calculateDegreeCentrality(TransactionGraph.AccountNode node, TransactionGraph graph) {
            int totalNodes = graph.getNodeCount();
            if (totalNodes <= 1) return 0.0;
            return (double) node.getDegree() / (totalNodes - 1);
        }

        private double calculateBetweennessCentrality(String accountId, TransactionGraph graph) {
            if (graph.getNodeCount() <= 2) return 0.0;

            double betweenness = 0.0;
            Set<String> allNodes = graph.getAllAccountIds();
            List<String> nodeList = new ArrayList<>(allNodes);

            int sampleSize = Math.min(50, nodeList.size());
            List<String> sampleNodes = nodeList.subList(0, sampleSize);

            for (int i = 0; i < sampleNodes.size(); i++) {
                for (int j = i + 1; j < sampleNodes.size(); j++) {
                    String s = sampleNodes.get(i);
                    String t = sampleNodes.get(j);
                    if (s.equals(accountId) || t.equals(accountId)) continue;

                    List<List<String>> allPaths = findAllShortestPaths(s, t, graph);
                    if (allPaths.isEmpty()) continue;

                    long pathsThroughNode = allPaths.stream()
                            .filter(path -> path.contains(accountId))
                            .count();

                    betweenness += (double) pathsThroughNode / allPaths.size();
                }
            }

            return betweenness;
        }

        private double calculateClosenessCentrality(String accountId, TransactionGraph graph) {
            Set<String> allNodes = graph.getAllAccountIds();
            if (allNodes.size() <= 1) return 0.0;

            double totalDistance = 0.0;
            int reachableNodes = 0;

            for (String other : allNodes) {
                if (!other.equals(accountId)) {
                    int distance = findShortestPathLength(accountId, other, graph);
                    if (distance > 0) {
                        totalDistance += distance;
                        reachableNodes++;
                    }
                }
            }

            if (reachableNodes == 0 || totalDistance == 0) return 0.0;

            return (double) reachableNodes / totalDistance;
        }

        private double calculateClusteringCoefficient(String accountId, TransactionGraph graph) {
            Set<String> neighbors = graph.getNeighbors(accountId);
            int k = neighbors.size();

            if (k < 2) return 0.0;

            int actualEdges = 0;
            List<String> neighborList = new ArrayList<>(neighbors);

            for (int i = 0; i < neighborList.size(); i++) {
                for (int j = i + 1; j < neighborList.size(); j++) {
                    if (graph.getEdge(neighborList.get(i), neighborList.get(j)) != null) {
                        actualEdges++;
                    }
                }
            }

            int maxPossibleEdges = k * (k - 1) / 2;
            return (double) actualEdges / maxPossibleEdges;
        }

        private double calculateEgoNetworkDensity(String accountId, TransactionGraph graph) {
            Set<String> neighbors = graph.getNeighbors(accountId);
            Set<String> egoNetwork = new HashSet<>(neighbors);
            egoNetwork.add(accountId);

            int n = egoNetwork.size();
            if (n < 2) return 0.0;

            int edges = 0;
            List<String> nodes = new ArrayList<>(egoNetwork);
            for (int i = 0; i < nodes.size(); i++) {
                for (int j = i + 1; j < nodes.size(); j++) {
                    if (graph.getEdge(nodes.get(i), nodes.get(j)) != null) {
                        edges++;
                    }
                }
            }

            int maxEdges = n * (n - 1);
            return (double) edges / maxEdges;
        }

        private double calculatePageRankIncremental(String accountId, TransactionGraph graph) throws Exception {
            Double currentRank = pageRankState.get(accountId);
            if (currentRank == null) {
                currentRank = 1.0 / Math.max(1, graph.getNodeCount());
            }

            Set<String> incomingNeighbors = new HashSet<>();
            for (String nodeId : graph.getAllAccountIds()) {
                if (graph.getEdge(nodeId, accountId) != null) {
                    incomingNeighbors.add(nodeId);
                }
            }

            double sum = 0.0;
            for (String neighbor : incomingNeighbors) {
                Double neighborRank = pageRankState.get(neighbor);
                if (neighborRank == null) neighborRank = 1.0 / Math.max(1, graph.getNodeCount());

                TransactionGraph.AccountNode neighborNode = graph.getNode(neighbor);
                int neighborOutDegree = neighborNode != null ? neighborNode.getOutDegree() : 1;

                sum += neighborRank / Math.max(1, neighborOutDegree);
            }

            double newRank = (1 - dampingFactor) / Math.max(1, graph.getNodeCount()) + dampingFactor * sum;

            pageRankState.put(accountId, newRank);
            return newRank;
        }

        private double calculateTransactionVelocity(TransactionGraph.AccountNode node) {
            long timeSpan = node.getLastActiveTime() - node.getLastActiveTime();
            if (timeSpan <= 0) timeSpan = TimeUnit.HOURS.toMillis(1);

            double hours = (double) timeSpan / TimeUnit.HOURS.toMillis(1);
            return (node.getInDegree() + node.getOutDegree()) / hours;
        }

        private double calculateFlowBalance(TransactionGraph.AccountNode node) {
            BigDecimal totalFlow = node.getTotalIncomingAmount().add(node.getTotalOutgoingAmount());
            if (totalFlow.compareTo(BigDecimal.ZERO) == 0) return 0.5;

            BigDecimal diff = node.getTotalIncomingAmount().subtract(node.getTotalOutgoingAmount()).abs();
            return 1.0 - diff.divide(totalFlow, 4, RoundingMode.HALF_UP).doubleValue();
        }

        private int findShortestPathLength(String start, String end, TransactionGraph graph) {
            if (start.equals(end)) return 0;

            Set<String> visited = new HashSet<>();
            Queue<Map.Entry<String, Integer>> queue = new LinkedList<>();
            queue.add(new AbstractMap.SimpleEntry<>(start, 0));
            visited.add(start);

            while (!queue.isEmpty()) {
                Map.Entry<String, Integer> current = queue.poll();
                String node = current.getKey();
                int depth = current.getValue();

                for (String neighbor : graph.getNeighbors(node)) {
                    if (neighbor.equals(end)) {
                        return depth + 1;
                    }
                    if (!visited.contains(neighbor)) {
                        visited.add(neighbor);
                        queue.add(new AbstractMap.SimpleEntry<>(neighbor, depth + 1));
                    }
                }
            }

            return -1;
        }

        private List<List<String>> findAllShortestPaths(String start, String end, TransactionGraph graph) {
            List<List<String>> result = new ArrayList<>();

            if (start.equals(end)) {
                List<String> path = new ArrayList<>();
                path.add(start);
                result.add(path);
                return result;
            }

            int shortestLength = findShortestPathLength(start, end, graph);
            if (shortestLength == -1) return result;

            findAllPathsDfs(start, end, graph, new ArrayList<>(), new HashSet<>(), shortestLength, result);
            return result;
        }

        private void findAllPathsDfs(String current, String end, TransactionGraph graph,
                                     List<String> path, Set<String> visited,
                                     int maxLength, List<List<String>> result) {
            path.add(current);
            visited.add(current);

            if (current.equals(end) && path.size() <= maxLength) {
                result.add(new ArrayList<>(path));
            } else if (path.size() < maxLength) {
                for (String neighbor : graph.getNeighbors(current)) {
                    if (!visited.contains(neighbor)) {
                        findAllPathsDfs(neighbor, end, graph, path, visited, maxLength, result);
                    }
                }
            }

            path.remove(path.size() - 1);
            visited.remove(current);
        }

        private void updateGlobalMetrics(TransactionGraph graph) throws Exception {
            GlobalGraphMetrics metrics = globalMetricsState.value();
            if (metrics == null) {
                metrics = new GlobalGraphMetrics();
            }

            metrics.setTotalNodes(graph.getNodeCount());
            metrics.setTotalEdges(graph.getEdgeCount());

            int totalDegree = 0;
            double maxDegreeCentrality = 0;
            double maxPageRank = 0;

            for (String accountId : graph.getAllAccountIds()) {
                TransactionGraph.AccountNode node = graph.getNode(accountId);
                if (node != null) {
                    totalDegree += node.getDegree();
                }

                NodeMetrics nodeMetrics = nodeMetricsState.get(accountId);
                if (nodeMetrics != null) {
                    maxDegreeCentrality = Math.max(maxDegreeCentrality, nodeMetrics.getDegreeCentrality());
                    maxPageRank = Math.max(maxPageRank, nodeMetrics.getPagerank());
                }
            }

            metrics.setAverageDegree(graph.getNodeCount() > 0 ?
                    (double) totalDegree / graph.getNodeCount() : 0);

            metrics.setGraphDensity(calculateGraphDensity(graph));

            metrics.setMaxDegreeCentrality(maxDegreeCentrality);
            metrics.setMaxPageRank(maxPageRank);

            metrics.setCalculationTime(System.currentTimeMillis());

            globalMetricsState.update(metrics);
        }

        private double calculateGraphDensity(TransactionGraph graph) {
            int n = graph.getNodeCount();
            if (n <= 1) return 0.0;
            int maxEdges = n * (n - 1);
            return (double) (graph.getEdgeCount() * 2) / maxEdges;
        }

        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<GraphMetricsSnapshot> out) throws Exception {
            GlobalGraphMetrics globalMetrics = globalMetricsState.value();
            if (globalMetrics != null) {
                GraphMetricsSnapshot snapshot = new GraphMetricsSnapshot();
                snapshot.setGlobalMetrics(globalMetrics);
                snapshot.setSnapshotTime(timestamp);

                Map<String, NodeMetrics> topNodesByPageRank = new HashMap<>();
                Map<String, NodeMetrics> topNodesByBetweenness = new HashMap<>();

                List<NodeMetrics> allNodeMetrics = new ArrayList<>();
                for (Map.Entry<String, NodeMetrics> entry : nodeMetricsState.entries()) {
                    allNodeMetrics.add(entry.getValue());
                }

                allNodeMetrics.sort((a, b) -> Double.compare(b.getPagerank(), a.getPagerank()));
                for (int i = 0; i < Math.min(10, allNodeMetrics.size()); i++) {
                    NodeMetrics nm = allNodeMetrics.get(i);
                    topNodesByPageRank.put(nm.getAccountId(), nm);
                }

                allNodeMetrics.sort((a, b) -> Double.compare(b.getBetweennessCentrality(), a.getBetweennessCentrality()));
                for (int i = 0; i < Math.min(10, allNodeMetrics.size()); i++) {
                    NodeMetrics nm = allNodeMetrics.get(i);
                    topNodesByBetweenness.put(nm.getAccountId(), nm);
                }

                snapshot.setTopNodesByPageRank(topNodesByPageRank);
                snapshot.setTopNodesByBetweenness(topNodesByBetweenness);

                out.collect(snapshot);
                LOG.info("Graph metrics snapshot generated: {} nodes, {} edges, density: {}",
                        globalMetrics.getTotalNodes(), globalMetrics.getTotalEdges(), globalMetrics.getGraphDensity());
            }
        }
    }

    @lombok.Data
    public static class NodeMetrics implements Serializable {
        private static final long serialVersionUID = 1L;

        private String accountId;
        private int inDegree;
        private int outDegree;
        private int degree;
        private BigDecimal totalIncomingAmount;
        private BigDecimal totalOutgoingAmount;
        private long lastActiveTime;
        private int neighborCount;

        private double degreeCentrality;
        private double betweennessCentrality;
        private double closenessCentrality;
        private double clusteringCoefficient;
        private double egoNetworkDensity;
        private double pagerank;
        private double transactionVelocity;
        private double flowBalance;
        private long lastCalculatedTime;
    }

    @lombok.Data
    public static class GlobalGraphMetrics implements Serializable {
        private static final long serialVersionUID = 1L;

        private int totalNodes;
        private int totalEdges;
        private double averageDegree;
        private double graphDensity;
        private double maxDegreeCentrality;
        private double maxPageRank;
        private long calculationTime;

        public long totalAlerts = 0;
        public long cycleCount = 0;
        public long denseSubgraphCount = 0;
        public long moneyLaunderingPatternCount = 0;
        public long structuringPatternCount = 0;
    }

    @lombok.Data
    public static class GraphMetricsSnapshot implements Serializable {
        private static final long serialVersionUID = 1L;

        private GlobalGraphMetrics globalMetrics;
        private Map<String, NodeMetrics> topNodesByPageRank;
        private Map<String, NodeMetrics> topNodesByBetweenness;
        private long snapshotTime;
    }
}
