package com.antifraud.late;

import com.antifraud.model.AlertEvent;
import com.antifraud.model.BaseEvent;
import org.apache.flink.api.common.state.MapState;
import org.apache.flink.api.common.state.MapStateDescriptor;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.ProcessFunction;
import org.apache.flink.util.Collector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

public class LateDataStatistics {
    private static final Logger LOG = LoggerFactory.getLogger(LateDataStatistics.class);

    public static class LateEventStats implements Serializable {
        public long totalLateLogins = 0;
        public long totalLateTransactions = 0;
        public long lateLoginCorrelations = 0;
        public long lateAlertsGenerated = 0;
        public Map<String, Integer> lateAlertsByAccount = new HashMap<>();
        public long lastUpdateTime;

        @Override
        public String toString() {
            return String.format(
                    "LateEventStats{lateLogins=%d, lateTransactions=%d, correlations=%d, alerts=%d}",
                    totalLateLogins, totalLateTransactions, lateLoginCorrelations, lateAlertsGenerated
            );
        }
    }

    public static class LateEventStatsCollector extends ProcessFunction<BaseEvent, LateEventStats> {
        private transient ValueState<LateEventStats> statsState;
        private transient MapState<String, Long> accountLateCount;
        private final long statsIntervalMs;

        public LateEventStatsCollector(long statsIntervalMs) {
            this.statsIntervalMs = statsIntervalMs;
        }

        @Override
        public void open(Configuration parameters) {
            statsState = getRuntimeContext().getState(
                    new ValueStateDescriptor<>("late-stats", LateEventStats.class)
            );
            accountLateCount = getRuntimeContext().getMapState(
                    new MapStateDescriptor<>("account-late-count", String.class, Long.class)
            );
        }

        @Override
        public void processElement(BaseEvent event, Context ctx, Collector<LateEventStats> out) throws Exception {
            LateEventStats stats = statsState.value();
            if (stats == null) {
                stats = new LateEventStats();
            }

            if (event.getEventType().equals("LOGIN")) {
                stats.totalLateLogins++;
            } else if (event.getEventType().equals("TRANSACTION")) {
                stats.totalLateTransactions++;
            }

            String accountId = event.getAccountId();
            Long count = accountLateCount.get(accountId);
            if (count == null) count = 0L;
            accountLateCount.put(accountId, count + 1);

            stats.lastUpdateTime = System.currentTimeMillis();
            statsState.update(stats);

            ctx.timerService().registerProcessingTimeTimer(System.currentTimeMillis() + statsIntervalMs);
        }

        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<LateEventStats> out) throws Exception {
            LateEventStats stats = statsState.value();
            if (stats != null) {
                LOG.info("Late data statistics: {}", stats);
                out.collect(stats);
            }
        }
    }

    public static class LateAlertStatsCollector extends ProcessFunction<AlertEvent, LateEventStats> {
        private transient ValueState<LateEventStats> statsState;
        private final long statsIntervalMs;

        public LateAlertStatsCollector(long statsIntervalMs) {
            this.statsIntervalMs = statsIntervalMs;
        }

        @Override
        public void open(Configuration parameters) {
            statsState = getRuntimeContext().getState(
                    new ValueStateDescriptor<>("late-alert-stats", LateEventStats.class)
            );
        }

        @Override
        public void processElement(AlertEvent alert, Context ctx, Collector<LateEventStats> out) throws Exception {
            LateEventStats stats = statsState.value();
            if (stats == null) {
                stats = new LateEventStats();
            }

            stats.lateAlertsGenerated++;
            stats.lateAlertsByAccount.merge(alert.getAccountId(), 1, Integer::sum);
            stats.lastUpdateTime = System.currentTimeMillis();
            statsState.update(stats);

            LOG.warn("Late alert generated for account: {}, detection delay: {}ms",
                    alert.getAccountId(), alert.getDetectionTimeMs());

            ctx.timerService().registerProcessingTimeTimer(System.currentTimeMillis() + statsIntervalMs);
        }

        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<LateEventStats> out) throws Exception {
            LateEventStats stats = statsState.value();
            if (stats != null) {
                out.collect(stats);
                statsState.update(new LateEventStats());
            }
        }
    }

    public static class LatenessDistributionCollector extends ProcessFunction<BaseEvent, Map<String, Object>> {
        private transient MapState<String, Long> latenessBuckets;

        @Override
        public void open(Configuration parameters) {
            latenessBuckets = getRuntimeContext().getMapState(
                    new MapStateDescriptor<>("lateness-buckets", String.class, Long.class)
            );
        }

        @Override
        public void processElement(BaseEvent event, Context ctx, Collector<Map<String, Object>> out) throws Exception {
            long latenessMs = ctx.timerService().currentWatermark() - event.getTimestamp();

            if (latenessMs > 0) {
                String bucket = getLatenessBucket(latenessMs);
                Long count = latenessBuckets.get(bucket);
                if (count == null) count = 0L;
                latenessBuckets.put(bucket, count + 1);

                Map<String, Object> result = new HashMap<>();
                result.put("accountId", event.getAccountId());
                result.put("eventType", event.getEventType());
                result.put("latenessMs", latenessMs);
                result.put("bucket", bucket);
                result.put("timestamp", System.currentTimeMillis());
                out.collect(result);
            }
        }

        private String getLatenessBucket(long latenessMs) {
            if (latenessMs <= 1000) return "0-1s";
            if (latenessMs <= 5000) return "1-5s";
            if (latenessMs <= 10000) return "5-10s";
            if (latenessMs <= 30000) return "10-30s";
            return ">30s";
        }
    }
}
