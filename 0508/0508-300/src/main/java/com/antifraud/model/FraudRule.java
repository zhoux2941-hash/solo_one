package com.antifraud.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.concurrent.TimeUnit;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudRule {
    private String ruleId;
    private String ruleName;
    private boolean enabled;
    private RuleType ruleType;
    private RuleConfig config;
    private long version;
    private long lastUpdateTime;

    public enum RuleType {
        MULTI_IP_LOGIN,
        LARGE_TRANSACTION,
        NEW_ACCOUNT_TRANSFER,
        COMPLEX_PATTERN
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RuleConfig {
        private long timeWindowSeconds;
        private int minIpCount;
        private BigDecimal largeTransactionThreshold;
        private TimeUnit timeUnit;
        private WindowType windowType;
        private int sessionGapMinutes;
    }

    public enum WindowType {
        SLIDING,
        SESSION,
        TUMBLING
    }
}
