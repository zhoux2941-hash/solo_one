package com.antifraud.late;

import com.antifraud.model.*;
import org.apache.flink.api.common.state.*;
import org.apache.flink.api.common.time.Time;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.co.KeyedCoProcessFunction;
import org.apache.flink.util.Collector;
import org.apache.flink.util.OutputTag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class LateDataHandler {
    private static final Logger LOG = LoggerFactory.getLogger(LateDataHandler.class);

    public static final OutputTag<BaseEvent> LATE_EVENT_TAG = new OutputTag<BaseEvent>("late-events") {};
    public static final OutputTag<AlertEvent> LATE_DETECTED_ALERT_TAG = new OutputTag<AlertEvent>("late-detected-alerts") {};

    public static long LATENESS_THRESHOLD_MS = 30 * 1000;
    public static long TRANSACTION_HOLD_TIME_MS = 2 * 60 * 1000;

    public static class LateEventReplayFunction extends KeyedCoProcessFunction<String, BaseEvent, BaseEvent, BaseEvent> {
        private transient ListState<LoginEvent> pendingLoginEvents;
        private transient ListState<TransactionEvent> pendingTransactionEvents;
        private transient ValueState<Long> lastWatermarkState;
        private transient MapState<String, Boolean> processedTransactions;

        @Override
        public void open(Configuration parameters) {
            pendingLoginEvents = getRuntimeContext().getListState(
                    new ListStateDescriptor<>("pending-logins", LoginEvent.class)
            );
            pendingTransactionEvents = getRuntimeContext().getListState(
                    new ListStateDescriptor<>("pending-transactions", TransactionEvent.class)
            );
            lastWatermarkState = getRuntimeContext().getState(
                    new ValueStateDescriptor<>("last-watermark", Long.class)
            );
            processedTransactions = getRuntimeContext().getMapState(
                    new MapStateDescriptor<>("processed-transactions", String.class, Boolean.class)
            );
        }

        @Override
        public void processElement1(BaseEvent value, Context ctx, Collector<BaseEvent> out) throws Exception {
            if (value.getEventType().equals("LOGIN")) {
                LoginEvent login = value.asLogin();
                long currentWatermark = ctx.timerService().currentWatermark();

                if (login.getTimestamp() + LATENESS_THRESHOLD_MS < currentWatermark && currentWatermark > 0) {
                    LOG.info("Late login event detected, attempting to correlate with pending transactions. Account: {}, IP: {}",
                            login.getAccountId(), login.getIpAddress());

                    List<TransactionEvent> transactions = new ArrayList<>();
                    pendingTransactionEvents.get().forEach(transactions::add);

                    int correlations = 0;
                    for (TransactionEvent tx : transactions) {
                        if (Math.abs(tx.getTimestamp() - login.getTimestamp()) < 2 * 60 * 1000) {
                            if (!processedTransactions.contains(tx.getTransactionId())) {
                                correlations++;
                                LOG.info("Late login correlated with transaction: {}, amount: {}",
                                        tx.getTransactionId(), tx.getAmount());
                            }
                        }
                    }

                    if (correlations > 0) {
                        ctx.output(LATE_EVENT_TAG, value);
                    }
                    return;
                }

                pendingLoginEvents.add(login);

                ctx.timerService().registerEventTimeTimer(
                        login.getTimestamp() + TRANSACTION_HOLD_TIME_MS
                );

                out.collect(value);
            }
        }

        @Override
        public void processElement2(BaseEvent value, Context ctx, Collector<BaseEvent> out) throws Exception {
            if (value.getEventType().equals("TRANSACTION")) {
                TransactionEvent transaction = value.asTransaction();
                long currentWatermark = ctx.timerService().currentWatermark();

                List<LoginEvent> logins = new ArrayList<>();
                pendingLoginEvents.get().forEach(logins::add);

                boolean hasRecentLogin = false;
                for (LoginEvent login : logins) {
                    if (Math.abs(transaction.getTimestamp() - login.getTimestamp()) < 5 * 60 * 1000) {
                        hasRecentLogin = true;
                        break;
                    }
                }

                if (!hasRecentLogin && currentWatermark > 0) {
                    LOG.info("Transaction arrived without prior login, holding for late login. Account: {}, Tx: {}",
                            transaction.getFromAccountId(), transaction.getTransactionId());
                    pendingTransactionEvents.add(transaction);
                    ctx.timerService().registerEventTimeTimer(
                            transaction.getTimestamp() + TRANSACTION_HOLD_TIME_MS
                    );
                }

                out.collect(value);
            }
        }

        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<BaseEvent> out) throws Exception {
            String accountId = ctx.getCurrentKey();
            LOG.debug("Timer fired for account: {}, timestamp: {}", accountId, timestamp);

            List<TransactionEvent> transactions = new ArrayList<>();
            pendingTransactionEvents.get().forEach(transactions::add);

            List<TransactionEvent> expiredTransactions = new ArrayList<>();
            long currentWatermark = ctx.timerService().currentWatermark();

            for (TransactionEvent tx : transactions) {
                if (tx.getTimestamp() + TRANSACTION_HOLD_TIME_MS <= currentWatermark) {
                    expiredTransactions.add(tx);
                    out.collect(BaseEvent.fromTransaction(tx));
                    processedTransactions.put(tx.getTransactionId(), true);
                }
            }

            if (!expiredTransactions.isEmpty()) {
                LOG.info("Released {} held transactions for account: {} after waiting for late logins",
                        expiredTransactions.size(), accountId);
                transactions.removeAll(expiredTransactions);
                pendingTransactionEvents.update(transactions);
            }

            List<LoginEvent> logins = new ArrayList<>();
            pendingLoginEvents.get().forEach(logins::add);
            List<LoginEvent> expiredLogins = new ArrayList<>();
            for (LoginEvent login : logins) {
                if (login.getTimestamp() + 10 * 60 * 1000 <= currentWatermark) {
                    expiredLogins.add(login);
                }
            }
            if (!expiredLogins.isEmpty()) {
                logins.removeAll(expiredLogins);
                pendingLoginEvents.update(logins);
            }
        }
    }

    public static class LateLoginReProcessor extends KeyedCoProcessFunction<String, LoginEvent, TransactionEvent, AlertEvent> {
        private transient ListState<TransactionEvent> recentTransactions;
        private transient ValueState<Boolean> hasMultipleIPs;

        private final BigDecimal largeTransactionThreshold;
        private final long patternWindowMs;

        public LateLoginReProcessor(BigDecimal largeTransactionThreshold, long patternWindowMs) {
            this.largeTransactionThreshold = largeTransactionThreshold;
            this.patternWindowMs = patternWindowMs;
        }

        @Override
        public void open(Configuration parameters) {
            recentTransactions = getRuntimeContext().getListState(
                    new ListStateDescriptor<>("recent-transactions", TransactionEvent.class)
            );
            hasMultipleIPs = getRuntimeContext().getState(
                    new ValueStateDescriptor<>("has-multiple-ips", Boolean.class)
            );
        }

        @Override
        public void processElement1(LoginEvent lateLogin, Context ctx, Collector<AlertEvent> out) throws Exception {
            String accountId = lateLogin.getAccountId();
            LOG.info("Re-processing late login for account: {}, IP: {}", accountId, lateLogin.getIpAddress());

            List<TransactionEvent> transactions = new ArrayList<>();
            recentTransactions.get().forEach(transactions::add);

            List<TransactionEvent> relevantTransactions = new ArrayList<>();
            for (TransactionEvent tx : transactions) {
                long timeDiff = Math.abs(tx.getTimestamp() - lateLogin.getTimestamp());
                if (timeDiff <= patternWindowMs) {
                    relevantTransactions.add(tx);
                }
            }

            Boolean multiIp = hasMultipleIPs.value();
            if (multiIp == null) {
                multiIp = false;
            }

            for (TransactionEvent tx : relevantTransactions) {
                boolean isLargeTransaction = tx.getAmount().compareTo(largeTransactionThreshold) >= 0;
                boolean toNewAccount = !tx.getToAccountId().startsWith("account-regular");

                if (multiIp && isLargeTransaction && toNewAccount) {
                    LOG.warn("Late login detected fraud pattern! Account: {}, Tx: {}", accountId, tx.getTransactionId());

                    AlertEvent alert = AlertEvent.builder()
                            .alertId(java.util.UUID.randomUUID().toString())
                            .accountId(accountId)
                            .alertType(AlertEvent.AlertType.COMPLEX_FRAUD_PATTERN)
                            .alertLevel(AlertEvent.AlertLevel.HIGH)
                            .timestamp(System.currentTimeMillis())
                            .description("Late login detected complex fraud pattern (after replay)")
                            .ipAddresses(java.util.Arrays.asList(lateLogin.getIpAddress()))
                            .transactionAmount(tx.getAmount())
                            .toAccountId(tx.getToAccountId())
                            .ruleId("rule-late-replay-001")
                            .ruleName("Late Login Fraud Detection")
                            .detectionTimeMs(System.currentTimeMillis() - lateLogin.getTimestamp())
                            .build();

                    ctx.output(LATE_DETECTED_ALERT_TAG, alert);
                    out.collect(alert);
                }
            }
        }

        @Override
        public void processElement2(TransactionEvent tx, Context ctx, Collector<AlertEvent> out) throws Exception {
            recentTransactions.add(tx);
            ctx.timerService().registerEventTimeTimer(tx.getTimestamp() + patternWindowMs);
        }

        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<AlertEvent> out) throws Exception {
            List<TransactionEvent> transactions = new ArrayList<>();
            recentTransactions.get().forEach(transactions::new);

            transactions.removeIf(tx -> timestamp - tx.getTimestamp() > 15 * 60 * 1000);
            recentTransactions.update(transactions);
        }
    }
}
