package com.antifraud.cep;

import com.antifraud.late.LateDataHandler;
import com.antifraud.model.*;
import org.apache.flink.cep.CEP;
import org.apache.flink.cep.PatternSelectFunction;
import org.apache.flink.cep.PatternStream;
import org.apache.flink.cep.pattern.Pattern;
import org.apache.flink.cep.pattern.conditions.IterativeCondition;
import org.apache.flink.cep.pattern.conditions.SimpleCondition;
import org.apache.flink.streaming.api.datastream.KeyedStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.OutputTag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.*;

public class EventTimeFraudPatternDetector {
    private static final Logger LOG = LoggerFactory.getLogger(EventTimeFraudPatternDetector.class);

    private final FraudRule rule;
    private final Set<String> knownAccounts;
    private final Map<String, List<String>> accountIpMap;

    public static final OutputTag<AlertEvent> PARTIAL_PATTERN_ALERT_TAG =
            new OutputTag<AlertEvent>("partial-pattern-alerts") {};

    public EventTimeFraudPatternDetector(FraudRule rule) {
        this.rule = rule;
        this.knownAccounts = Collections.synchronizedSet(new HashSet<>());
        this.accountIpMap = Collections.synchronizedMap(new HashMap<>());
    }

    public Pattern<BaseEvent, ?> buildComplexFraudPattern() {
        long timeWindowSeconds = rule.getConfig().getTimeWindowSeconds();

        return Pattern.<BaseEvent>begin("multi-ip-login-first")
                .where(new SimpleCondition<BaseEvent>() {
                    @Override
                    public boolean filter(BaseEvent event) {
                        if (!event.getEventType().equals("LOGIN")) return false;
                        LoginEvent login = event.asLogin();
                        if (!login.isSuccess()) return false;

                        String accountId = login.getAccountId();
                        accountIpMap.computeIfAbsent(accountId, k -> new ArrayList<>());

                        if (!accountIpMap.get(accountId).contains(login.getIpAddress())) {
                            accountIpMap.get(accountId).add(login.getIpAddress());
                        }
                        return true;
                    }
                })
                .next("multi-ip-login-second")
                .where(new IterativeCondition<BaseEvent>() {
                    @Override
                    public boolean filter(BaseEvent event, Context<BaseEvent> ctx) {
                        if (!event.getEventType().equals("LOGIN")) return false;
                        LoginEvent login2 = event.asLogin();
                        if (!login2.isSuccess()) return false;

                        Optional<BaseEvent> firstLoginOpt = ctx.getEventsForPattern("multi-ip-login-first").findFirst();
                        if (firstLoginOpt.isEmpty()) return false;

                        BaseEvent firstLoginEvent = firstLoginOpt.get();
                        LoginEvent login1 = firstLoginEvent.asLogin();

                        long timeDiff = Math.abs(login2.getTimestamp() - login1.getTimestamp());
                        boolean differentIp = !login1.getIpAddress().equals(login2.getIpAddress());
                        boolean withinWindow = timeDiff <= timeWindowSeconds * 1000;

                        if (differentIp) {
                            LOG.debug("Multi-IP login detected for account: {}, IP1: {}, IP2: {}, timeDiff: {}ms",
                                    login2.getAccountId(), login1.getIpAddress(), login2.getIpAddress(), timeDiff);
                        }

                        return differentIp && withinWindow;
                    }
                })
                .within(Time.seconds(timeWindowSeconds))
                .next("large-transaction")
                .where(new IterativeCondition<BaseEvent>() {
                    @Override
                    public boolean filter(BaseEvent event, Context<BaseEvent> ctx) {
                        if (!event.getEventType().equals("TRANSACTION")) return false;
                        TransactionEvent tx = event.asTransaction();

                        BigDecimal threshold = rule.getConfig().getLargeTransactionThreshold();
                        boolean isLarge = tx.getAmount().compareTo(threshold) >= 0;

                        if (isLarge) {
                            LOG.debug("Large transaction detected for account: {}, amount: {}",
                                    tx.getFromAccountId(), tx.getAmount());
                        }

                        return isLarge;
                    }
                })
                .within(Time.seconds(timeWindowSeconds))
                .next("new-account-transfer")
                .where(new IterativeCondition<BaseEvent>() {
                    @Override
                    public boolean filter(BaseEvent event, Context<BaseEvent> ctx) {
                        if (!event.getEventType().equals("TRANSACTION")) return false;
                        TransactionEvent tx = event.asTransaction();

                        String toAccountId = tx.getToAccountId();
                        boolean isNewAccount = !knownAccounts.contains(toAccountId);

                        if (!isNewAccount) {
                            knownAccounts.add(toAccountId);
                        }

                        if (isNewAccount) {
                            LOG.debug("New account transfer detected for account: {} -> {}",
                                    tx.getFromAccountId(), toAccountId);
                        }

                        return isNewAccount;
                    }
                })
                .within(Time.seconds(timeWindowSeconds));
    }

    public PatternStream<BaseEvent> buildPatternStream(KeyedStream<BaseEvent, String> keyedStream) {
        Pattern<BaseEvent, ?> pattern = buildComplexFraudPattern();
        return CEP.pattern(keyedStream, pattern).inEventTime();
    }

    public SingleOutputStreamOperator<AlertEvent> processPatternStream(
            PatternStream<BaseEvent> patternStream) {

        return patternStream.select(createAlertSelectFunction());
    }

    private PatternSelectFunction<BaseEvent, AlertEvent> createAlertSelectFunction() {
        return patternMap -> {
            long detectionStartTime = System.currentTimeMillis();

            List<BaseEvent> firstLogins = (List<BaseEvent>) patternMap.get("multi-ip-login-first");
            List<BaseEvent> secondLogins = (List<BaseEvent>) patternMap.get("multi-ip-login-second");
            List<BaseEvent> largeTransactions = (List<BaseEvent>) patternMap.get("large-transaction");
            List<BaseEvent> newTransfers = (List<BaseEvent>) patternMap.get("new-account-transfer");

            if (firstLogins.isEmpty() || secondLogins.isEmpty()) {
                LOG.warn("Pattern matched but missing login events!");
                return null;
            }

            BaseEvent login1 = firstLogins.get(0);
            BaseEvent login2 = secondLogins.get(0);
            BaseEvent largeTx = !largeTransactions.isEmpty() ? largeTransactions.get(0) : null;
            BaseEvent newTx = !newTransfers.isEmpty() ? newTransfers.get(0) : null;

            List<String> ipAddresses = new ArrayList<>();
            ipAddresses.add(login1.asLogin().getIpAddress());
            ipAddresses.add(login2.asLogin().getIpAddress());

            AlertEvent alert = AlertEvent.builder()
                    .alertId(UUID.randomUUID().toString())
                    .accountId(login1.getAccountId())
                    .alertType(AlertEvent.AlertType.COMPLEX_FRAUD_PATTERN)
                    .alertLevel(AlertEvent.AlertLevel.CRITICAL)
                    .timestamp(System.currentTimeMillis())
                    .description("Detected complex fraud pattern in event time: multi-IP login -> large transaction -> new account transfer")
                    .ipAddresses(ipAddresses)
                    .transactionAmount(largeTx != null ? largeTx.asTransaction().getAmount() : BigDecimal.ZERO)
                    .toAccountId(newTx != null ? newTx.asTransaction().getToAccountId() : "UNKNOWN")
                    .ruleId(rule.getRuleId())
                    .ruleName(rule.getRuleName())
                    .detectionTimeMs(System.currentTimeMillis() - detectionStartTime)
                    .build();

            LOG.info("Generated alert from event time pattern: {}", alert);
            return alert;
        };
    }

    public void addKnownAccount(String accountId) {
        knownAccounts.add(accountId);
    }

    public Set<String> getKnownAccounts() {
        return knownAccounts;
    }
}
