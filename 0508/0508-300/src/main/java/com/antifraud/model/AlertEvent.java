package com.antifraud.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertEvent {
    private String alertId;
    private String accountId;
    private AlertType alertType;
    private AlertLevel alertLevel;
    private long timestamp;
    private String description;
    private List<String> ipAddresses;
    private BigDecimal transactionAmount;
    private String toAccountId;
    private String ruleId;
    private String ruleName;
    private long detectionTimeMs;

    public enum AlertType {
        MULTI_IP_LOGIN,
        LARGE_TRANSACTION,
        NEW_ACCOUNT_TRANSFER,
        COMPLEX_FRAUD_PATTERN
    }

    public enum AlertLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
}
