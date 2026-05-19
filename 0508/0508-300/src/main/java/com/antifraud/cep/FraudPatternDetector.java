package com.antifraud.cep;

import com.antifraud.model.*;
import org.apache.flink.cep.CEP;
import org.apache.flink.cep.PatternSelectFunction;
import org.apache.flink.cep.PatternStream;
import org.apache.flink.cep.pattern.Pattern;
import org.apache.flink.cep.pattern.conditions.IterativeCondition;
import org.apache.flink.cep.pattern.conditions.SimpleCondition;
import org.apache.flink.streaming.api.datastream.KeyedStream;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.*;

public class FraudPatternDetector {
    private static final Logger LOG = LoggerFactory.getLogger(FraudPatternDetector.class);

    private final FraudRule rule;
    private final Set<String> knownAccounts;

    public FraudPatternDetector(FraudRule rule) {
        this.rule = rule;
        this.knownAccounts = Collections.synchronizedSet(new HashSet<>());
    }

    public PatternStream<BaseEvent> buildPatternStream(KeyedStream<BaseEvent, String> keyedStream) {
        Pattern<BaseEvent, ?> pattern = buildComplexFraudPattern();
        return CEP.pattern(keyedStream, pattern);
    }

    private Pattern<BaseEvent, ?> buildComplexFraudPattern() {
        long timeWindow = rule.getConfig().getTimeWindowSeconds();
        BigDecimal largeThreshold = rule.getConfig().getLargeTransactionThreshold();

        return Pattern.<BaseEvent>begin("multi-ip-login-first")
                .where(new SimpleCondition<BaseEvent>() {
                    @Override
                    public boolean filter(BaseEvent event) {
                        return event.getEventType().equals("LOGIN") && event.asLogin().isSuccess();
                    }
                })
                .next("multi-ip-login-second")
                .where(new IterativeCondition<BaseEvent>() {
                    @Override
                    public boolean filter(BaseEvent event, Context<BaseEvent> ctx) {
                        if (!event.getEventType().equals("LOGIN") || !event.asLogin().isSuccess()) {
                            return false;
                        }
                        BaseEvent firstLogin = ctx.getEventsForPattern("multi-ip-login-first").iterator().next();
                        String firstIp = firstLogin.asLogin().getIpAddress();
                        String secondIp = event.asLogin().getIpAddress();
                        long timeDiff = event.getTimestamp() - firstLogin.getTimestamp();
                        return !firstIp.equals(secondIp) && timeDiff <= timeWindow * 1000;
                    }
                })
                .within(Time.seconds(timeWindow))
                .next("large-transaction")
                .where(new SimpleCondition<BaseEvent>() {
                    @Override
                    public boolean filter(BaseEvent event) {
                        if (!event.getEventType().equals("TRANSACTION")) {
                            return false;
                        }
                        return event.asTransaction().getAmount().compareTo(largeThreshold) >= 0;
                    }
                })
                .within(Time.seconds(timeWindow))
                .next("new-account-transfer")
                .where(new SimpleCondition<BaseEvent>() {
                    @Override
                    public boolean filter(BaseEvent event) {
                        if (!event.getEventType().equals("TRANSACTION")) {
                            return false;
                        }
                        String toAccountId = event.asTransaction().getToAccountId();
                        boolean isNewAccount = !knownAccounts.contains(toAccountId);
                        if (!isNewAccount) {
                            knownAccounts.add(toAccountId);
                        }
                        return isNewAccount;
                    }
                })
                .within(Time.seconds(timeWindow));
    }

    public PatternSelectFunction<BaseEvent, AlertEvent> createAlertSelectFunction() {
        return patternMap -> {
            long startTime = System.currentTimeMillis();

            List<BaseEvent> firstLogins = (List<BaseEvent>) patternMap.get("multi-ip-login-first");
            List<BaseEvent> secondLogins = (List<BaseEvent>) patternMap.get("multi-ip-login-second");
            List<BaseEvent> largeTransactions = (List<BaseEvent>) patternMap.get("large-transaction");
            List<BaseEvent> newTransfers = (List<BaseEvent>) patternMap.get("new-account-transfer");

            BaseEvent login1 = firstLogins.get(0);
            BaseEvent login2 = secondLogins.get(0);
            BaseEvent largeTx = largeTransactions.get(0);
            BaseEvent newTx = newTransfers.get(0);

            List<String> ipAddresses = Arrays.asList(
                    login1.asLogin().getIpAddress(),
                    login2.asLogin().getIpAddress()
            );

            AlertEvent alert = AlertEvent.builder()
                    .alertId(UUID.randomUUID().toString())
                    .accountId(login1.getAccountId())
                    .alertType(AlertEvent.AlertType.COMPLEX_FRAUD_PATTERN)
                    .alertLevel(AlertEvent.AlertLevel.CRITICAL)
                    .timestamp(System.currentTimeMillis())
                    .description("Detected complex fraud pattern: multi-IP login -> large transaction -> new account transfer")
                    .ipAddresses(ipAddresses)
                    .transactionAmount(largeTx.asTransaction().getAmount())
                    .toAccountId(newTx.asTransaction().getToAccountId())
                    .ruleId(rule.getRuleId())
                    .ruleName(rule.getRuleName())
                    .detectionTimeMs(System.currentTimeMillis() - startTime)
                    .build();

            LOG.info("Generated alert: {}", alert);
            return alert;
        };
    }

    public void addKnownAccount(String accountId) {
        knownAccounts.add(accountId);
    }
}
