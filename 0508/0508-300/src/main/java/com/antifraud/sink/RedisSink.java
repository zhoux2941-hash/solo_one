package com.antifraud.sink;

import com.antifraud.model.AlertEvent;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommand;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommandDescription;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RedisSink {
    private static final Logger LOG = LoggerFactory.getLogger(RedisSink.class);

    public static RedisMapper<AlertEvent> createBlacklistMapper() {
        return new RedisMapper<AlertEvent>() {
            @Override
            public RedisCommandDescription getCommandDescription() {
                return new RedisCommandDescription(RedisCommand.SET, null);
            }

            @Override
            public String getKeyFromData(AlertEvent alert) {
                return "blacklist:" + alert.getAccountId();
            }

            @Override
            public String getValueFromData(AlertEvent alert) {
                return String.format("%s:%d:%s",
                        alert.getAlertType().name(),
                        alert.getTimestamp(),
                        alert.getAlertLevel().name());
            }
        };
    }

    public static RedisMapper<AlertEvent> createAlertStatisticsMapper() {
        return new RedisMapper<AlertEvent>() {
            @Override
            public RedisCommandDescription getCommandDescription() {
                return new RedisCommandDescription(RedisCommand.HINCRBY, "alert_stats");
            }

            @Override
            public String getKeyFromData(AlertEvent alert) {
                return alert.getRuleId();
            }

            @Override
            public String getValueFromData(AlertEvent alert) {
                return "1";
            }
        };
    }

    public static class RedisExpirationMapper implements RedisMapper<AlertEvent> {
        private final int ttlSeconds;

        public RedisExpirationMapper(int ttlSeconds) {
            this.ttlSeconds = ttlSeconds;
        }

        @Override
        public RedisCommandDescription getCommandDescription() {
            return new RedisCommandDescription(RedisCommand.SETEX, null);
        }

        @Override
        public String getKeyFromData(AlertEvent alert) {
            return "blacklist:" + alert.getAccountId();
        }

        @Override
        public String getValueFromData(AlertEvent alert) {
            return String.valueOf(ttlSeconds) + ":" + alert.getAlertType().name();
        }
    }
}
