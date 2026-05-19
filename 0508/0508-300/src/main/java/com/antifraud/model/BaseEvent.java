package com.antifraud.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BaseEvent {
    private String eventType;
    private Object eventData;
    private long timestamp;
    private String accountId;

    public static BaseEvent fromLogin(LoginEvent login) {
        BaseEvent event = new BaseEvent();
        event.eventType = "LOGIN";
        event.eventData = login;
        event.timestamp = login.getTimestamp();
        event.accountId = login.getAccountId();
        return event;
    }

    public static BaseEvent fromTransaction(TransactionEvent transaction) {
        BaseEvent event = new BaseEvent();
        event.eventType = "TRANSACTION";
        event.eventData = transaction;
        event.timestamp = transaction.getTimestamp();
        event.accountId = transaction.getFromAccountId();
        return event;
    }

    public LoginEvent asLogin() {
        return (LoginEvent) eventData;
    }

    public TransactionEvent asTransaction() {
        return (TransactionEvent) eventData;
    }
}
