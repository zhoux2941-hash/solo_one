package com.antifraud.graph;

import com.antifraud.model.TransactionEvent;
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

public class IncrementalGraphUpdater {
    private static final Logger LOG = LoggerFactory.getLogger(IncrementalGraphUpdater.class);

    public static class GraphUpdaterFunction extends KeyedCoProcessFunction<String, TransactionEvent, TransactionEvent, GraphUpdateResult> {

        private transient ValueState<TransactionGraph> graphState;
        private transient MapState<String, TransactionGraph.AccountNode> nodeState;
        private transient MapState<String, TransactionGraph.TransactionEdge> edgeState;
        private transient ListState<TransactionEvent> pendingTransactions;
        private transient ValueState<GraphMetrics> metricsState;

        private final long graphRetentionTime;
        private final long staleNodeThreshold;

        public GraphUpdaterFunction(long retentionTimeHours, long staleNodeThresholdDays) {
            this.graphRetentionTime = TimeUnit.HOURS.toMillis(retentionTimeHours);
            this.staleNodeThreshold = TimeUnit.DAYS.toMillis(staleNodeThresholdDays);
        }

        @Override
        public void open(Configuration parameters) throws Exception {
            ValueStateDescriptor<TransactionGraph> graphDescriptor =
                    new ValueStateDescriptor<>("global-graph", TransactionGraph.class);
            graphDescriptor.enableTimeToLive(StateTtl.newBuilder(Time.days(7))
                    .setUpdateType(StateTtl.UpdateType.OnCreateAndWrite)
                    .build());
            graphState = getRuntimeContext().getState(graphDescriptor);

            MapStateDescriptor<String, TransactionGraph.AccountNode> nodeDescriptor =
                    new MapStateDescriptor<>("graph-nodes", String.class, TransactionGraph.AccountNode.class);
            nodeDescriptor.enableTimeToLive(StateTtl.newBuilder(Time.days(7)).build());
            nodeState = getRuntimeContext().getMapState(nodeDescriptor);

            MapStateDescriptor<String, TransactionGraph.TransactionEdge> edgeDescriptor =
                    new MapStateDescriptor<>("graph-edges", String.class, TransactionGraph.TransactionEdge.class);
            edgeDescriptor.enableTimeToLive(StateTtl.newBuilder(Time.days(7)).build());
            edgeState = getRuntimeContext().getMapState(edgeDescriptor);

            ListStateDescriptor<TransactionEvent> pendingDescriptor =
                    new ListStateDescriptor<>("pending-transactions", TransactionEvent.class);
            pendingDescriptor.enableTimeToLive(StateTtl.newBuilder(Time.hours(1)).build());
            pendingTransactions = getRuntimeContext().getListState(pendingDescriptor);

            ValueStateDescriptor<GraphMetrics> metricsDescriptor =
                    new ValueStateDescriptor<>("graph-metrics", GraphMetrics.class);
            metricsState = getRuntimeContext().getState(metricsDescriptor);
        }

        @Override
        public void processElement1(TransactionEvent tx, Context ctx, Collector<GraphUpdateResult> out) throws Exception {
            processTransaction(tx, ctx, out);
        }

        @Override
        public void processElement2(TransactionEvent tx, Context ctx, Collector<GraphUpdateResult> out) throws Exception {
            processTransaction(tx, ctx, out);
        }

        private void processTransaction(TransactionEvent tx, Context ctx, Collector<GraphUpdateResult> out) throws Exception {
            long currentTime = System.currentTimeMillis();
            String fromAccount = tx.getFromAccount();
            String toAccount = tx.getToAccount();

            TransactionGraph graph = graphState.value();
            if (graph == null) {
                graph = new TransactionGraph();
            }

            graph.addTransaction(fromAccount, toAccount, tx.getAmount(), tx.getTimestamp());

            TransactionGraph.AccountNode fromNode = graph.getNode(fromAccount);
            TransactionGraph.AccountNode toNode = graph.getNode(toAccount);
            TransactionGraph.TransactionEdge edge = graph.getEdge(fromAccount, toAccount);

            nodeState.put(fromAccount, fromNode);
            nodeState.put(toAccount, toNode);
            edgeState.put(fromAccount + "->" + toAccount, edge);
            graphState.update(graph);

            updateMetrics(tx);

            GraphUpdateResult result = GraphUpdateResult.builder()
                    .updateTime(currentTime)
                    .transactionId(tx.getTransactionId())
                    .fromAccount(fromAccount)
                    .toAccount(toAccount)
                    .amount(tx.getAmount())
                    .totalNodes(graph.getNodeCount())
                    .totalEdges(graph.getEdgeCount())
                    .fromNodeDegree(fromNode.getDegree())
                    .toNodeDegree(toNode.getDegree())
                    .edgeTransactionCount(edge.getTransactionCount())
                    .build();

            checkAnomalies(fromNode, toNode, edge, result, currentTime);

            out.collect(result);

            ctx.timerService().registerEventTimeTimer(currentTime + graphRetentionTime);
        }

        private void updateMetrics(TransactionEvent tx) throws Exception {
            GraphMetrics metrics = metricsState.value();
            if (metrics == null) {
                metrics = new GraphMetrics();
            }
            metrics.totalTransactions++;
            metrics.totalVolume = metrics.totalVolume.add(tx.getAmount());
            metrics.lastUpdateTime = System.currentTimeMillis();
            metricsState.update(metrics);
        }

        private void checkAnomalies(
                TransactionGraph.AccountNode fromNode,
                TransactionGraph.AccountNode toNode,
                TransactionGraph.TransactionEdge edge,
                GraphUpdateResult result,
                long currentTime) {

            List<AnomalyScore> anomalies = new ArrayList<>();

            if (fromNode.getOutDegree() > 50) {
                anomalies.add(AnomalyScore.builder()
                        .type(AnomalyType.HIGH_OUT_DEGREE)
                        .score(Math.min(1.0, fromNode.getOutDegree() / 100.0))
                        .description("Account has unusually high outgoing transactions: " + fromNode.getOutDegree())
                        .accountId(fromNode.getAccountId())
                        .build());
            }

            if (toNode.getInDegree() > 100) {
                anomalies.add(AnomalyScore.builder()
                        .type(AnomalyType.HIGH_IN_DEGREE)
                        .score(Math.min(1.0, toNode.getInDegree() / 200.0))
                        .description("Account has unusually high incoming transactions: " + toNode.getInDegree())
                        .accountId(toNode.getAccountId())
                        .build());
            }

            if (edge.getTransactionCount() > 100) {
                anomalies.add(AnomalyScore.builder()
                        .type(AnomalyType.FREQUENT_TRANSFERS)
                        .score(Math.min(1.0, edge.getTransactionCount() / 200.0))
                        .description("Frequent transfers between accounts: " + edge.getTransactionCount() + " times")
                        .accountId(fromNode.getAccountId())
                        .relatedAccountId(toNode.getAccountId())
                        .build());
            }

            BigDecimal turnoverRatio = fromNode.getTotalOutgoingAmount().compareTo(BigDecimal.ZERO) > 0
                    ? fromNode.getTotalIncomingAmount().divide(fromNode.getTotalOutgoingAmount(), 4, BigDecimal.ROUND_HALF_UP)
                    : BigDecimal.ZERO;

            if (turnoverRatio.compareTo(new BigDecimal("10")) > 0) {
                anomalies.add(AnomalyScore.builder()
                        .type(AnomalyType.HIGH_TURNOVER_RATIO)
                        .score(Math.min(1.0, turnoverRatio.doubleValue() / 100.0))
                        .description("High turnover ratio: " + turnoverRatio)
                        .accountId(fromNode.getAccountId())
                        .build());
            }

            result.setAnomalies(anomalies);

            if (!anomalies.isEmpty()) {
                result.setHasAnomaly(true);
                double maxScore = anomalies.stream()
                        .mapToDouble(AnomalyScore::getScore)
                        .max()
                        .orElse(0.0);
                result.setMaxAnomalyScore(maxScore);
            }
        }

        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<GraphUpdateResult> out) throws Exception {
            TransactionGraph graph = graphState.value();
            if (graph != null) {
                long cleanupThreshold = timestamp - staleNodeThreshold;
                List<String> staleNodes = new ArrayList<>();

                for (String accountId : graph.getAllAccountIds()) {
                    TransactionGraph.AccountNode node = graph.getNode(accountId);
                    if (node != null && node.getLastActiveTime() < cleanupThreshold) {
                        staleNodes.add(accountId);
                    }
                }

                for (String staleNode : staleNodes) {
                    graph.removeNode(staleNode);
                }

                if (!staleNodes.isEmpty()) {
                    graphState.update(graph);
                    LOG.info("Cleaned up {} stale nodes from transaction graph", staleNodes.size());
                }
            }
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GraphUpdateResult implements Serializable {
        private static final long serialVersionUID = 1L;

        private long updateTime;
        private String transactionId;
        private String fromAccount;
        private String toAccount;
        private BigDecimal amount;
        private int totalNodes;
        private int totalEdges;
        private int fromNodeDegree;
        private int toNodeDegree;
        private int edgeTransactionCount;
        private boolean hasAnomaly;
        private double maxAnomalyScore;
        private List<AnomalyScore> anomalies;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnomalyScore implements Serializable {
        private static final long serialVersionUID = 1L;

        private AnomalyType type;
        private double score;
        private String description;
        private String accountId;
        private String relatedAccountId;
    }

    public enum AnomalyType {
        HIGH_OUT_DEGREE,
        HIGH_IN_DEGREE,
        FREQUENT_TRANSFERS,
        HIGH_TURNOVER_RATIO,
        CYCLE_DETECTED,
        DENSE_SUBGRAPH,
        MONEY_LAUNDERING_PATTERN,
        STRUCTURING_PATTERN
    }

    @Data
    public static class GraphMetrics implements Serializable {
        private static final long serialVersionUID = 1L;

        public long totalTransactions = 0;
        public BigDecimal totalVolume = BigDecimal.ZERO;
        public long lastUpdateTime = System.currentTimeMillis();
    }
}
