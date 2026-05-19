package com.antifraud.watermark;

import com.antifraud.model.BaseEvent;
import com.antifraud.model.LoginEvent;
import com.antifraud.model.TransactionEvent;
import org.apache.flink.api.common.eventtime.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;

public class EventTimeAssigner {
    private static final Logger LOG = LoggerFactory.getLogger(EventTimeAssigner.class);

    private static final Duration MAX_OUT_OF_ORDERNESS = Duration.ofSeconds(30);
    private static final Duration IDLENESS_TIMEOUT = Duration.ofSeconds(10);

    public static WatermarkStrategy<BaseEvent> createBaseEventWatermarkStrategy() {
        return WatermarkStrategy
                .<BaseEvent>forBoundedOutOfOrderness(MAX_OUT_OF_ORDERNESS)
                .withIdleness(IDLENESS_TIMEOUT)
                .withTimestampAssigner((SerializableTimestampAssigner<BaseEvent>) (event, recordTimestamp) -> {
                    long timestamp = extractTimestamp(event);
                    if (timestamp <= 0) {
                        LOG.warn("Invalid timestamp {} for event type: {}", timestamp, event.getEventType());
                        return System.currentTimeMillis();
                    }
                    return timestamp;
                });
    }

    public static WatermarkStrategy<LoginEvent> createLoginEventWatermarkStrategy() {
        return WatermarkStrategy
                .<LoginEvent>forBoundedOutOfOrderness(MAX_OUT_OF_ORDERNESS)
                .withIdleness(IDLENESS_TIMEOUT)
                .withTimestampAssigner((SerializableTimestampAssigner<LoginEvent>) (event, recordTimestamp) -> {
                    long timestamp = event.getTimestamp();
                    if (timestamp <= 0) {
                        LOG.warn("Invalid timestamp {} for login event of account: {}", timestamp, event.getAccountId());
                        return System.currentTimeMillis();
                    }
                    return timestamp;
                });
    }

    public static WatermarkStrategy<TransactionEvent> createTransactionEventWatermarkStrategy() {
        return WatermarkStrategy
                .<TransactionEvent>forBoundedOutOfOrderness(MAX_OUT_OF_ORDERNESS)
                .withIdleness(IDLENESS_TIMEOUT)
                .withTimestampAssigner((SerializableTimestampAssigner<TransactionEvent>) (event, recordTimestamp) -> {
                    long timestamp = event.getTimestamp();
                    if (timestamp <= 0) {
                        LOG.warn("Invalid timestamp {} for transaction event of account: {}", timestamp, event.getFromAccountId());
                        return System.currentTimeMillis();
                    }
                    return timestamp;
                });
    }

    private static long extractTimestamp(BaseEvent event) {
        if (event == null) {
            return System.currentTimeMillis();
        }
        return event.getTimestamp();
    }

    public static long getMaxOutOfOrdernessMillis() {
        return MAX_OUT_OF_ORDERNESS.toMillis();
    }
}
