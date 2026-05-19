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
import java.util.*;
import java.util.concurrent.TimeUnit;

public class AnomalySubgraphDetector {
    private static final Logger LOG = LoggerFactory.getLogger(AnomalySubgraphDetector.class);

    public static class SubgraphDetectionFunction extends KeyedCoProcessFunction<String,
            IncrementalGraphUpdater.GraphUpdateResult,
            IncrementalGraphUpdater.GraphUpdateResult,
            SubgraphAlert> {

        private transient ValueState<TransactionGraph> localGraphState;
        private transient MapState<String, List<String>> adjacencyListState;
        private transient MapState<String, Set<String>> cycleDetectionState;
        private transient ValueState<DenseSubgraphResult> denseSubgraphState;
        private transient ListState<String> recentAccountsState;

        private final int maxCycleLength;
        private final int denseSubgraphMinSize;
        private final double denseSubgraphThreshold;
        private final long detectionWindowMs;

        public SubgraphDetectionFunction(int maxCycleLength, int denseSubgraphMinSize,
                                         double denseSubgraphThreshold, long detectionWindowMinutes) {
            this.maxCycleLength = maxCycleLength;
            this.denseSubgraphMinSize = denseSubgraphMinSize;
            this.denseSubgraphThreshold = denseSubgraphThreshold;
            this.detectionWindowMs = TimeUnit.MINUTES.toMillis(detectionWindowMinutes);
        }

        @Override
        public void open(Configuration parameters) throws Exception {
            ValueStateDescriptor<TransactionGraph> graphDescriptor =
                    new ValueStateDescriptor<>("local-graph", TransactionGraph.class);
            graphDescriptor.enableTimeToLive(StateTtl.newBuilder(Time.hours(24)).build());
            localGraphState = getRuntimeContext().getState(graphDescriptor);

            MapStateDescriptor<String, List<String>> adjacencyDescriptor =
                    new MapStateDescriptor<>("adjacency-list", String.class,
                            (Class<List<String>>) (Class<?>) List.class);
            adjacencyListState = getRuntimeContext().getMapState(adjacencyDescriptor);

            MapStateDescriptor<String, Set<String>> cycleDescriptor =
                    new MapStateDescriptor<>("cycle-detection", String.class,
                            (Class<Set<String>>) (Class<?>) Set.class);
            cycleDetectionState = getRuntimeContext().getMapState(cycleDescriptor);

            ValueStateDescriptor<DenseSubgraphResult> denseDescriptor =
                    new ValueStateDescriptor<>("dense-subgraph", DenseSubgraphResult.class);
            denseSubgraphState = getRuntimeContext().getState(denseDescriptor);

            ListStateDescriptor<String> recentAccountsDescriptor =
                    new ListStateDescriptor<>("recent-accounts", String.class);
            recentAccountsDescriptor.enableTimeToLive(StateTtl.newBuilder(Time.hours(1)).build());
            recentAccountsState = getRuntimeContext().getListState(recentAccountsDescriptor);
        }

        @Override
        public void processElement1(IncrementalGraphUpdater.GraphUpdateResult result,
                                    Context ctx, Collector<SubgraphAlert> out) throws Exception {
            processGraphUpdate(result, ctx, out);
        }

        @Override
        public void processElement2(IncrementalGraphUpdater.GraphUpdateResult result,
                                    Context ctx, Collector<SubgraphAlert> out) throws Exception {
            processGraphUpdate(result, ctx, out);
        }

        private void processGraphUpdate(IncrementalGraphUpdater.GraphUpdateResult result,
                                        Context ctx, Collector<SubgraphAlert> out) throws Exception {
            TransactionGraph graph = localGraphState.value();
            if (graph == null) {
                graph = new TransactionGraph();
            }
            graph.addTransaction(result.getFromAccount(), result.getToAccount(),
                    result.getAmount(), result.getUpdateTime());
            localGraphState.update(graph);

            updateAdjacencyList(result.getFromAccount(), result.getToAccount());

            recentAccountsState.add(result.getFromAccount());
            recentAccountsState.add(result.getToAccount());

            List<String> cycle = detectCycle(result.getFromAccount(), result.getToAccount(), graph);
            if (cycle != null && cycle.size() >= 3) {
                SubgraphAlert alert = createCycleAlert(cycle, graph, result);
                out.collect(alert);
                LOG.warn("Cycle detected in transaction graph: {}", cycle);
            }

            DenseSubgraphResult denseSubgraph = detectDenseSubgraph(graph, result.getFromAccount());
            if (denseSubgraph != null && denseSubgraph.getDensity() > denseSubgraphThreshold
                    && denseSubgraph.getNodes().size() >= denseSubgraphMinSize) {
                SubgraphAlert alert = createDenseSubgraphAlert(denseSubgraph, result);
                out.collect(alert);
                LOG.warn("Dense subgraph detected: {} nodes, density: {}",
                        denseSubgraph.getNodes().size(), denseSubgraph.getDensity());
            }

            MoneyLaunderingPattern mlPattern = detectMoneyLaunderingPattern(result.getFromAccount(), graph);
            if (mlPattern != null) {
                SubgraphAlert alert = createMoneyLaunderingAlert(mlPattern, result);
                out.collect(alert);
                LOG.warn("Money laundering pattern detected around account: {}", result.getFromAccount());
            }

            StructuringPattern structuringPattern = detectStructuringPattern(result.getFromAccount(), graph);
            if (structuringPattern != null) {
                SubgraphAlert alert = createStructuringAlert(structuringPattern, result);
                out.collect(alert);
                LOG.warn("Structuring pattern detected for account: {}", result.getFromAccount());
            }

            ctx.timerService().registerProcessingTimeTimer(System.currentTimeMillis() + detectionWindowMs);
        }

        private void updateAdjacencyList(String from, String to) throws Exception {
            List<String> neighbors = adjacencyListState.get(from);
            if (neighbors == null) {
                neighbors = new ArrayList<>();
            }
            if (!neighbors.contains(to)) {
                neighbors.add(to);
                adjacencyListState.put(from, neighbors);
            }
        }

        private List<String> detectCycle(String start, String end, TransactionGraph graph) {
            Set<String> visited = new HashSet<>();
            Map<String, String> parent = new HashMap<>();
            Queue<String> queue = new LinkedList<>();

            queue.add(start);
            visited.add(start);

            while (!queue.isEmpty()) {
                String current = queue.poll();

                if (current.equals(end) && parent.size() >= 2) {
                    List<String> path = new ArrayList<>();
                    String node = end;
                    while (node != null) {
                        path.add(node);
                        node = parent.get(node);
                    }
                    Collections.reverse(path);
                    if (path.size() <= maxCycleLength) {
                        return path;
                    }
                }

                for (String neighbor : graph.getNeighbors(current)) {
                    if (!visited.contains(neighbor)) {
                        visited.add(neighbor);
                        parent.put(neighbor, current);
                        queue.add(neighbor);
                    }
                }
            }

            return null;
        }

        private DenseSubgraphResult detectDenseSubgraph(TransactionGraph graph, String seedNode) {
            Set<String> subgraphNodes = new HashSet<>();
            Queue<String> queue = new LinkedList<>();

            queue.add(seedNode);
            subgraphNodes.add(seedNode);

            while (!queue.isEmpty() && subgraphNodes.size() < 20) {
                String current = queue.poll();
                for (String neighbor : graph.getNeighbors(current)) {
                    if (!subgraphNodes.contains(neighbor)) {
                        TransactionGraph.AccountNode node = graph.getNode(neighbor);
                        if (node != null && node.getDegree() >= 3) {
                            subgraphNodes.add(neighbor);
                            queue.add(neighbor);
                        }
                    }
                }
            }

            if (subgraphNodes.size() < denseSubgraphMinSize) {
                return null;
            }

            int actualEdges = 0;
            for (String node : subgraphNodes) {
                for (String neighbor : graph.getNeighbors(node)) {
                    if (subgraphNodes.contains(neighbor)) {
                        actualEdges++;
                    }
                }
            }
            actualEdges = actualEdges / 2;

            int n = subgraphNodes.size();
            int maxPossibleEdges = n * (n - 1) / 2;
            double density = maxPossibleEdges > 0 ? (double) actualEdges / maxPossibleEdges : 0.0;

            BigDecimal totalVolume = BigDecimal.ZERO;
            for (String nodeId : subgraphNodes) {
                TransactionGraph.AccountNode node = graph.getNode(nodeId);
                if (node != null) {
                    totalVolume = totalVolume.add(node.getTotalIncomingAmount());
                }
            }

            return DenseSubgraphResult.builder()
                    .nodes(new ArrayList<>(subgraphNodes))
                    .edgeCount(actualEdges)
                    .density(density)
                    .totalVolume(totalVolume)
                    .seedNode(seedNode)
                    .build();
        }

        private MoneyLaunderingPattern detectMoneyLaunderingPattern(String account, TransactionGraph graph) {
            TransactionGraph.AccountNode node = graph.getNode(account);
            if (node == null) return null;

            List<TransactionGraph.TransactionEdge> incoming = graph.getIncomingEdges(account);
            List<TransactionGraph.TransactionEdge> outgoing = graph.getOutgoingEdges(account);

            if (incoming.size() < 2 || outgoing.size() < 2) {
                return null;
            }

            BigDecimal totalIncoming = node.getTotalIncomingAmount();
            BigDecimal totalOutgoing = node.getTotalOutgoingAmount();

            BigDecimal ratio = totalOutcoming.divide(totalIncoming.max(BigDecimal.ONE), 4, BigDecimal.ROUND_HALF_UP);

            boolean hasLayeredStructure = incoming.size() >= 3 && outgoing.size() >= 3;
            boolean hasHighTurnover = ratio.compareTo(new BigDecimal("0.8")) >= 0
                    && ratio.compareTo(new BigDecimal("1.2")) <= 0;
            boolean hasQuickTurnover = hasQuickTurnover(node, graph);

            if (hasLayeredStructure && hasHighTurnover && hasQuickTurnover) {
                return MoneyLaunderingPattern.builder()
                        .coreAccount(account)
                        .layerCount(Math.min(incoming.size(), outgoing.size()))
                        .turnoverRatio(ratio.doubleValue())
                        .totalVolume(totalIncoming.add(totalOutgoing))
                        .sourceAccounts(incoming.stream()
                                .map(TransactionGraph.TransactionEdge::getFromAccount)
                                .limit(5).collect(java.util.stream.Collectors.toList()))
                        .destinationAccounts(outgoing.stream()
                                .map(TransactionGraph.TransactionEdge::getToAccount)
                                .limit(5).collect(java.util.stream.Collectors.toList()))
                        .build();
            }

            return null;
        }

        private boolean hasQuickTurnover(TransactionGraph.AccountNode node, TransactionGraph graph) {
            long timeSpan = node.getLastActiveTime() - node.getLastActiveTime();
            BigDecimal turnover = node.getTotalIncomingAmount().add(node.getTotalOutgoingAmount());
            return timeSpan < TimeUnit.HOURS.toMillis(24) &&
                    turnover.compareTo(new BigDecimal("100000")) >= 0;
        }

        private StructuringPattern detectStructuringPattern(String account, TransactionGraph graph) {
            TransactionGraph.AccountNode node = graph.getNode(account);
            if (node == null) return null;

            List<TransactionGraph.TransactionEdge> outgoing = graph.getOutgoingEdges(account);

            if (outgoing.size() < 5) {
                return null;
            }

            BigDecimal threshold = new BigDecimal("50000");
            int justBelowThreshold = 0;
            BigDecimal totalAmount = BigDecimal.ZERO;

            for (TransactionGraph.TransactionEdge edge : outgoing) {
                if (edge.getMaxAmount().compareTo(threshold.multiply(new BigDecimal("0.8"))) >= 0
                        && edge.getMaxAmount().compareTo(threshold) < 0) {
                    justBelowThreshold++;
                }
                totalAmount = totalAmount.add(edge.getTotalAmount());
            }

            if (justBelowThreshold >= 5) {
                List<String> recipientAccounts = outgoing.stream()
                        .map(TransactionGraph.TransactionEdge::getToAccount)
                        .limit(10)
                        .collect(java.util.stream.Collectors.toList());

                return StructuringPattern.builder()
                        .sourceAccount(account)
                        .justBelowThresholdCount(justBelowThreshold)
                        .totalStructuredAmount(totalAmount)
                        .recipientCount(outgoing.size())
                        .recipientAccounts(recipientAccounts)
                        .build();
            }

            return null;
        }

        private SubgraphAlert createCycleAlert(List<String> cycle, TransactionGraph graph,
                                               IncrementalGraphUpdater.GraphUpdateResult result) {
            BigDecimal totalVolume = BigDecimal.ZERO;
            for (int i = 0; i < cycle.size(); i++) {
                String from = cycle.get(i);
                String to = cycle.get((i + 1) % cycle.size());
                TransactionGraph.TransactionEdge edge = graph.getEdge(from, to);
                if (edge != null) {
                    totalVolume = totalVolume.add(edge.getTotalAmount());
                }
            }

            return SubgraphAlert.builder()
                    .alertId(UUID.randomUUID().toString())
                    .alertType(SubgraphAlertType.CYCLE_DETECTED)
                    .alertLevel(calculateAlertLevel(cycle.size(), totalVolume))
                    .timestamp(System.currentTimeMillis())
                    .description("Cycle detected in transaction graph, possible money circulation")
                    .affectedAccounts(cycle)
                    .cycleLength(cycle.size())
                    .totalVolume(totalVolume)
                    .triggerTransactionId(result.getTransactionId())
                    .confidence(Math.min(0.95, 0.5 + cycle.size() * 0.1))
                    .build();
        }

        private SubgraphAlert createDenseSubgraphAlert(DenseSubgraphResult subgraph,
                                                        IncrementalGraphUpdater.GraphUpdateResult result) {
            return SubgraphAlert.builder()
                    .alertId(UUID.randomUUID().toString())
                    .alertType(SubgraphAlertType.DENSE_SUBGRAPH)
                    .alertLevel(calculateDenseSubgraphAlertLevel(subgraph))
                    .timestamp(System.currentTimeMillis())
                    .description("Dense subgraph detected, possible organized fraud ring")
                    .affectedAccounts(subgraph.getNodes())
                    .density(subgraph.getDensity())
                    .subgraphSize(subgraph.getNodes().size())
                    .totalVolume(subgraph.getTotalVolume())
                    .triggerTransactionId(result.getTransactionId())
                    .confidence(Math.min(0.9, 0.3 + subgraph.getDensity() * 0.5))
                    .build();
        }

        private SubgraphAlert createMoneyLaunderingAlert(MoneyLaunderingPattern pattern,
                                                         IncrementalGraphUpdater.GraphUpdateResult result) {
            return SubgraphAlert.builder()
                    .alertId(UUID.randomUUID().toString())
                    .alertType(SubgraphAlertType.MONEY_LAUNDERING_PATTERN)
                    .alertLevel(SubgraphAlertLevel.CRITICAL)
                    .timestamp(System.currentTimeMillis())
                    .description("Potential money laundering pattern detected with layered structure")
                    .affectedAccounts(java.util.stream.Stream.concat(
                            pattern.getSourceAccounts().stream(),
                            pattern.getDestinationAccounts().stream()
                    ).distinct().collect(java.util.stream.Collectors.toList()))
                    .layerCount(pattern.getLayerCount())
                    .turnoverRatio(pattern.getTurnoverRatio())
                    .totalVolume(pattern.getTotalVolume())
                    .triggerTransactionId(result.getTransactionId())
                    .confidence(Math.min(0.95, 0.4 + pattern.getTurnoverRatio() * 0.3))
                    .build();
        }

        private SubgraphAlert createStructuringAlert(StructuringPattern pattern,
                                                      IncrementalGraphUpdater.GraphUpdateResult result) {
            return SubgraphAlert.builder()
                    .alertId(UUID.randomUUID().toString())
                    .alertType(SubgraphAlertType.STRUCTURING_PATTERN)
                    .alertLevel(SubgraphAlertLevel.HIGH)
                    .timestamp(System.currentTimeMillis())
                    .description("Structuring pattern detected - splitting transactions to avoid threshold detection")
                    .affectedAccounts(pattern.getRecipientAccounts())
                    .structuringCount(pattern.getJustBelowThresholdCount())
                    .totalVolume(pattern.getTotalStructuredAmount())
                    .triggerTransactionId(result.getTransactionId())
                    .confidence(Math.min(0.85, 0.3 + pattern.getJustBelowThresholdCount() * 0.1))
                    .build();
        }

        private SubgraphAlertLevel calculateAlertLevel(int cycleLength, BigDecimal volume) {
            if (cycleLength >= 6 || volume.compareTo(new BigDecimal("1000000")) >= 0) {
                return SubgraphAlertLevel.CRITICAL;
            } else if (cycleLength >= 4 || volume.compareTo(new BigDecimal("100000")) >= 0) {
                return SubgraphAlertLevel.HIGH;
            } else {
                return SubgraphAlertLevel.MEDIUM;
            }
        }

        private SubgraphAlertLevel calculateDenseSubgraphAlertLevel(DenseSubgraphResult subgraph) {
            if (subgraph.getDensity() >= 0.8 || subgraph.getNodes().size() >= 10) {
                return SubgraphAlertLevel.CRITICAL;
            } else if (subgraph.getDensity() >= 0.6 || subgraph.getNodes().size() >= 5) {
                return SubgraphAlertLevel.HIGH;
            } else {
                return SubgraphAlertLevel.MEDIUM;
            }
        }

        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<SubgraphAlert> out) throws Exception {
            TransactionGraph graph = localGraphState.value();
            if (graph != null) {
                long cleanupThreshold = timestamp - detectionWindowMs;
                List<String> staleAccounts = new ArrayList<>();

                for (String accountId : graph.getAllAccountIds()) {
                    TransactionGraph.AccountNode node = graph.getNode(accountId);
                    if (node != null && node.getLastActiveTime() < cleanupThreshold) {
                        staleAccounts.add(accountId);
                    }
                }

                for (String staleAccount : staleAccounts) {
                    graph.removeNode(staleAccount);
                }

                localGraphState.update(graph);
            }
        }
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DenseSubgraphResult implements Serializable {
        private static final long serialVersionUID = 1L;

        private List<String> nodes;
        private int edgeCount;
        private double density;
        private BigDecimal totalVolume;
        private String seedNode;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class MoneyLaunderingPattern implements Serializable {
        private static final long serialVersionUID = 1L;

        private String coreAccount;
        private int layerCount;
        private double turnoverRatio;
        private BigDecimal totalVolume;
        private List<String> sourceAccounts;
        private List<String> destinationAccounts;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StructuringPattern implements Serializable {
        private static final long serialVersionUID = 1L;

        private String sourceAccount;
        private int justBelowThresholdCount;
        private BigDecimal totalStructuredAmount;
        private int recipientCount;
        private List<String> recipientAccounts;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SubgraphAlert implements Serializable {
        private static final long serialVersionUID = 1L;

        private String alertId;
        private SubgraphAlertType alertType;
        private SubgraphAlertLevel alertLevel;
        private long timestamp;
        private String description;
        private List<String> affectedAccounts;
        private Integer cycleLength;
        private Integer subgraphSize;
        private Integer layerCount;
        private Integer structuringCount;
        private Double density;
        private Double turnoverRatio;
        private BigDecimal totalVolume;
        private String triggerTransactionId;
        private double confidence;
    }

    public enum SubgraphAlertType {
        CYCLE_DETECTED,
        DENSE_SUBGRAPH,
        MONEY_LAUNDERING_PATTERN,
        STRUCTURING_PATTERN
    }

    public enum SubgraphAlertLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
}
