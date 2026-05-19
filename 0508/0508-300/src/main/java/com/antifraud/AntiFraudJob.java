package com.antifraud;

import com.antifraud.cep.EventTimeFraudPatternDetector;
import com.antifraud.dashboard.DashboardServer;
import com.antifraud.graph.AnomalySubgraphDetector;
import com.antifraud.graph.GraphMetricsCalculator;
import com.antifraud.graph.IncrementalGraphUpdater;
import com.antifraud.grpc.RuleGrpcServer;
import com.antifraud.late.LateDataHandler;
import com.antifraud.late.LateDataStatistics;
import com.antifraud.model.*;
import com.antifraud.sink.ElasticsearchSink;
import com.antifraud.sink.RedisSink;
import com.antifraud.source.KafkaDeserializationSchema;
import com.antifraud.watermark.EventTimeAssigner;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.KeyedStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.redis.RedisSinkFlink;
import org.apache.flink.streaming.connectors.redis.common.config.FlinkJedisPoolConfig;
import org.apache.http.HttpHost;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

public class AntiFraudJob {
    private static final Logger LOG = LoggerFactory.getLogger(AntiFraudJob.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static volatile FraudRule currentRule;
    private static final long STATS_INTERVAL_MS = 60_000;

    private static final int MAX_CYCLE_LENGTH = 10;
    private static final int DENSE_SUBGRAPH_MIN_SIZE = 5;
    private static final double DENSE_SUBGRAPH_THRESHOLD = 0.7;
    private static final long DETECTION_WINDOW_MINUTES = 60;
    private static final long METRICS_UPDATE_INTERVAL_MINUTES = 5;
    private static final double PAGERANK_DAMPING_FACTOR = 0.85;
    private static final int PAGERANK_MAX_ITERATIONS = 20;

    public static void main(String[] args) throws Exception {
        LOG.info("Starting Anti-Fraud System with Graph Analysis Support...");

        startGrpcServer();
        startDashboard();

        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.enableCheckpointing(5000);
        env.getConfig().setAutoWatermarkInterval(100);
        env.getConfig().setLatencyTrackingInterval(5000);

        currentRule = FraudRule.builder()
                .ruleId("rule-001")
                .ruleName("Complex Fraud Pattern Detection (Event Time + Graph)")
                .enabled(true)
                .ruleType(FraudRule.RuleType.COMPLEX_PATTERN)
                .config(FraudRule.RuleConfig.builder()
                        .timeWindowSeconds(10)
                        .minIpCount(2)
                        .largeTransactionThreshold(new BigDecimal("10000"))
                        .windowType(FraudRule.WindowType.SLIDING)
                        .sessionGapMinutes(5)
                        .build())
                .version(3)
                .lastUpdateTime(System.currentTimeMillis())
                .build();

        KafkaSource<LoginEvent> loginSource = KafkaSource.<LoginEvent>builder()
                .setBootstrapServers("localhost:9092")
                .setTopics("login-events")
                .setGroupId("antifraud-login-v3")
                .setStartingOffsets(OffsetsInitializer.latest())
                .setValueOnlyDeserializer(new KafkaDeserializationSchema<>(LoginEvent.class))
                .build();

        KafkaSource<TransactionEvent> transactionSource = KafkaSource.<TransactionEvent>builder()
                .setBootstrapServers("localhost:9092")
                .setTopics("transaction-events")
                .setGroupId("antifraud-transaction-v3")
                .setStartingOffsets(OffsetsInitializer.latest())
                .setValueOnlyDeserializer(new KafkaDeserializationSchema<>(TransactionEvent.class))
                .build();

        DataStream<LoginEvent> loginStream = env.fromSource(
                loginSource,
                EventTimeAssigner.createLoginEventWatermarkStrategy(),
                "Login Events Source (Event Time)"
        );

        DataStream<TransactionEvent> transactionStream = env.fromSource(
                transactionSource,
                EventTimeAssigner.createTransactionEventWatermarkStrategy(),
                "Transaction Events Source (Event Time)"
        );

        DataStream<BaseEvent> baseLoginStream = loginStream
                .map((MapFunction<LoginEvent, BaseEvent>) BaseEvent::fromLogin);

        DataStream<BaseEvent> baseTransactionStream = transactionStream
                .map((MapFunction<TransactionEvent, BaseEvent>) BaseEvent::fromTransaction);

        DataStream<BaseEvent> unifiedStream = baseLoginStream
                .union(baseTransactionStream)
                .assignTimestampsAndWatermarks(EventTimeAssigner.createBaseEventWatermarkStrategy())
                .name("Unified Event Stream with Watermarks");

        KeyedStream<BaseEvent, String> keyedStream = unifiedStream.keyBy(
                (KeySelector<BaseEvent, String>) BaseEvent::getAccountId
        );

        SingleOutputStreamOperator<BaseEvent> processedStream = keyedStream
                .connect(keyedStream)
                .process(new LateDataHandler.LateEventReplayFunction())
                .name("Late Data Handler");

        DataStream<BaseEvent> lateEvents = processedStream.getSideOutput(LateDataHandler.LATE_EVENT_TAG);
        lateEvents
                .process(new LateDataStatistics.LateEventStatsCollector(STATS_INTERVAL_MS))
                .name("Late Event Stats Collector")
                .print("Late Event Stats: ");

        lateEvents
                .process(new LateDataStatistics.LatenessDistributionCollector())
                .name("Lateness Distribution Collector")
                .print("Lateness Distribution: ");

        KeyedStream<BaseEvent, String> processedKeyedStream = processedStream
                .assignTimestampsAndWatermarks(EventTimeAssigner.createBaseEventWatermarkStrategy())
                .keyBy((KeySelector<BaseEvent, String>) BaseEvent::getAccountId);

        EventTimeFraudPatternDetector patternDetector = new EventTimeFraudPatternDetector(currentRule);

        SingleOutputStreamOperator<AlertEvent> alertStream = patternDetector
                .processPatternStream(patternDetector.buildPatternStream(processedKeyedStream));

        alertStream.print("Alert (Event Time): ");

        DataStream<AlertEvent> lateAlerts = alertStream.getSideOutput(LateDataHandler.LATE_DETECTED_ALERT_TAG);
        lateAlerts
                .process(new LateDataStatistics.LateAlertStatsCollector(STATS_INTERVAL_MS))
                .name("Late Alert Stats Collector")
                .print("Late Alert Stats: ");

        alertStream = alertStream.union(lateAlerts);

        DataStream<TransactionEvent> transactionEventStream = transactionStream;
        KeyedStream<TransactionEvent, String> transactionKeyedStream = transactionEventStream
                .keyBy((KeySelector<TransactionEvent, String>) TransactionEvent::getFromAccount);

        SingleOutputStreamOperator<IncrementalGraphUpdater.GraphUpdateResult> graphUpdateStream =
                transactionKeyedStream
                        .connect(transactionKeyedStream)
                        .process(new IncrementalGraphUpdater.GraphUpdaterFunction(24, 7))
                        .name("Incremental Graph Updater");

        graphUpdateStream
                .filter(result -> result.isHasAnomaly())
                .print("Graph Anomaly Detected: ");

        graphUpdateStream.addSink(result -> {
            if (result.isHasAnomaly()) {
                Map<String, Object> graphAlertMap = new HashMap<>();
                graphAlertMap.put("alertId", "graph-" + System.currentTimeMillis() + "-" + result.getFromAccount());
                graphAlertMap.put("accountId", result.getFromAccount());
                graphAlertMap.put("alertType", "GRAPH_ANOMALY");
                graphAlertMap.put("alertLevel", mapAnomalyScoreToLevel(result.getMaxAnomalyScore()));
                graphAlertMap.put("timestamp", result.getUpdateTime());
                graphAlertMap.put("description", "Graph-based anomaly detected: " + result.getAnomalies());
                graphAlertMap.put("maxAnomalyScore", result.getMaxAnomalyScore());
                graphAlertMap.put("ruleId", "graph-rule-001");
                graphAlertMap.put("ruleName", "Graph Pattern Detection");
                DashboardServer.addAlert(graphAlertMap);
            }
        }).name("Graph Anomaly Dashboard Sink");

        KeyedStream<IncrementalGraphUpdater.GraphUpdateResult, String> graphUpdateKeyedStream =
                graphUpdateStream.keyBy((KeySelector<IncrementalGraphUpdater.GraphUpdateResult, String>)
                        result -> result.getFromAccount());

        SingleOutputStreamOperator<AnomalySubgraphDetector.SubgraphAlert> subgraphAlertStream =
                graphUpdateKeyedStream
                        .connect(graphUpdateKeyedStream)
                        .process(new AnomalySubgraphDetector.SubgraphDetectionFunction(
                                MAX_CYCLE_LENGTH,
                                DENSE_SUBGRAPH_MIN_SIZE,
                                DENSE_SUBGRAPH_THRESHOLD,
                                DETECTION_WINDOW_MINUTES
                        ))
                        .name("Anomaly Subgraph Detector");

        subgraphAlertStream.print("Subgraph Alert: ");

        subgraphAlertStream.addSink(alert -> {
            Map<String, Object> alertMap = new HashMap<>();
            alertMap.put("alertId", alert.getAlertId());
            alertMap.put("alertType", alert.getAlertType().name());
            alertMap.put("alertLevel", alert.getAlertLevel().name());
            alertMap.put("timestamp", alert.getTimestamp());
            alertMap.put("description", alert.getDescription());
            alertMap.put("affectedAccounts", alert.getAffectedAccounts());
            alertMap.put("affectedCount", alert.getAffectedAccounts() != null ? alert.getAffectedAccounts().size() : 0);

            if (alert.getCycleLength() != null) alertMap.put("cycleLength", alert.getCycleLength());
            if (alert.getSubgraphSize() != null) alertMap.put("subgraphSize", alert.getSubgraphSize());
            if (alert.getLayerCount() != null) alertMap.put("layerCount", alert.getLayerCount());
            if (alert.getStructuringCount() != null) alertMap.put("structuringCount", alert.getStructuringCount());
            if (alert.getDensity() != null) alertMap.put("density", alert.getDensity());
            if (alert.getTurnoverRatio() != null) alertMap.put("turnoverRatio", alert.getTurnoverRatio());
            if (alert.getTotalVolume() != null) alertMap.put("totalVolume", alert.getTotalVolume().doubleValue());

            alertMap.put("confidence", alert.getConfidence());
            alertMap.put("ruleId", "subgraph-detection");
            alertMap.put("ruleName", "Graph Subgraph Anomaly Detection");
            alertMap.put("isSubgraphAlert", true);

            DashboardServer.addAlert(alertMap);
            DashboardServer.addSubgraphAlert(alert);
        }).name("Subgraph Alert Dashboard Sink");

        KeyedStream<IncrementalGraphUpdater.GraphUpdateResult, String> metricsKeyedStream =
                graphUpdateStream.keyBy((KeySelector<IncrementalGraphUpdater.GraphUpdateResult, String>)
                        result -> "global");

        KeyedStream<AnomalySubgraphDetector.SubgraphAlert, String> alertKeyedStream =
                subgraphAlertStream.keyBy((KeySelector<AnomalySubgraphDetector.SubgraphAlert, String>)
                        alert -> "global");

        SingleOutputStreamOperator<GraphMetricsCalculator.GraphMetricsSnapshot> metricsSnapshotStream =
                metricsKeyedStream
                        .connect(alertKeyedStream)
                        .process(new GraphMetricsCalculator.MetricsCalculationFunction(
                                METRICS_UPDATE_INTERVAL_MINUTES,
                                PAGERANK_DAMPING_FACTOR,
                                PAGERANK_MAX_ITERATIONS
                        ))
                        .name("Graph Metrics Calculator");

        metricsSnapshotStream.print("Graph Metrics Snapshot: ");

        metricsSnapshotStream.addSink(snapshot -> {
            DashboardServer.updateGraphMetrics(snapshot);
        }).name("Graph Metrics Dashboard Sink");

        alertStream.addSink(alert -> {
            Map<String, Object> alertMap = new HashMap<>();
            alertMap.put("alertId", alert.getAlertId());
            alertMap.put("accountId", alert.getAccountId());
            alertMap.put("alertType", alert.getAlertType().name());
            alertMap.put("alertLevel", alert.getAlertLevel().name());
            alertMap.put("timestamp", alert.getTimestamp());
            alertMap.put("description", alert.getDescription());
            alertMap.put("ipAddresses", alert.getIpAddresses());
            alertMap.put("transactionAmount", alert.getTransactionAmount() != null ? alert.getTransactionAmount().doubleValue() : null);
            alertMap.put("toAccountId", alert.getToAccountId());
            alertMap.put("ruleId", alert.getRuleId());
            alertMap.put("ruleName", alert.getRuleName());
            alertMap.put("detectionTimeMs", alert.getDetectionTimeMs());
            alertMap.put("isLateReplay", alert.getRuleId().contains("late"));
            DashboardServer.addAlert(alertMap);
        }).name("Dashboard Sink");

        try {
            FlinkJedisPoolConfig redisConfig = new FlinkJedisPoolConfig.Builder()
                    .setHost("localhost")
                    .setPort(6379)
                    .build();

            alertStream.addSink(new RedisSinkFlink<>(redisConfig, RedisSink.createBlacklistMapper()))
                    .name("Redis Blacklist Sink");

            alertStream.addSink(new RedisSinkFlink<>(redisConfig, RedisSink.createAlertStatisticsMapper()))
                    .name("Redis Stats Sink");
        } catch (Exception e) {
            LOG.warn("Redis sink not configured, continuing without Redis", e);
        }

        try {
            org.apache.flink.streaming.connectors.elasticsearch7.ElasticsearchSink<AlertEvent> esSink =
                    ElasticsearchSink.createElasticsearchSink(
                            Arrays.asList(new HttpHost("localhost", 9200, "http")),
                            "antifraud-alerts-v3"
                    );
            alertStream.addSink(esSink).name("Elasticsearch Sink");
        } catch (Exception e) {
            LOG.warn("Elasticsearch sink not configured, continuing without Elasticsearch", e);
        }

        LOG.info("============================================================");
        LOG.info("  Anti-Fraud System Configuration:");
        LOG.info("  - Watermark Strategy: Bounded Out-of-Orderness (30s)");
        LOG.info("  - Event Time: Enabled");
        LOG.info("  - Late Data Handling: Enabled (Side Output + Replay)");
        LOG.info("  - Graph Analysis: Enabled");
        LOG.info("    - Cycle Detection: Max {} nodes", MAX_CYCLE_LENGTH);
        LOG.info("    - Dense Subgraph: Min {} nodes, Threshold {}", DENSE_SUBGRAPH_MIN_SIZE, DENSE_SUBGRAPH_THRESHOLD);
        LOG.info("    - Money Laundering Pattern: Enabled");
        LOG.info("    - Structuring Pattern: Enabled");
        LOG.info("    - Metrics Update: Every {} minutes", METRICS_UPDATE_INTERVAL_MINUTES);
        LOG.info("============================================================");

        env.execute("Flink Real-Time Anti-Fraud System (Graph Analysis v3)");
    }

    private static String mapAnomalyScoreToLevel(double score) {
        if (score >= 0.8) return "CRITICAL";
        if (score >= 0.6) return "HIGH";
        if (score >= 0.4) return "MEDIUM";
        return "LOW";
    }

    private static void startGrpcServer() {
        new Thread(() -> {
            try {
                RuleGrpcServer grpcServer = new RuleGrpcServer(50051, updatedRule -> {
                    LOG.info("Rule updated via gRPC: {}", updatedRule);
                    currentRule = updatedRule;
                });
                grpcServer.start();
                grpcServer.blockUntilShutdown();
            } catch (Exception e) {
                LOG.error("gRPC server failed to start", e);
            }
        }).start();
    }

    private static void startDashboard() {
        new Thread(() -> {
            try {
                DashboardServer dashboard = new DashboardServer(8080);
                dashboard.start();
            } catch (Exception e) {
                LOG.error("Dashboard server failed to start", e);
            }
        }).start();
    }
}
