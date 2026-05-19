package com.antifraud.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEvent {
    private String transactionId;
    private String fromAccountId;
    private String toAccountId;
    private BigDecimal amount;
    private long timestamp;
    private String currency;
    private String transactionType;
    private String merchant;
    private String location;
}
