package com.antifraud;

import com.antifraud.model.LoginEvent;
import com.antifraud.model.TransactionEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.Future;

public class TestDataGenerator {
    private static final Logger LOG = LoggerFactory.getLogger(TestDataGenerator.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final KafkaProducer<String, String> producer;
    private final String bootstrapServers;

    public TestDataGenerator(String bootstrapServers) {
        this.bootstrapServers = bootstrapServers;
        this.producer = createProducer();
    }

    private KafkaProducer<String, String> createProducer() {
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
        return new KafkaProducer<>(props);
    }

    public Future<RecordMetadata> sendLoginEvent(LoginEvent event) throws Exception {
        String json = objectMapper.writeValueAsString(event);
        ProducerRecord<String, String> record = new ProducerRecord<>("login-events", event.getAccountId(), json);
        return producer.send(record);
    }

    public Future<RecordMetadata> sendTransactionEvent(TransactionEvent event) throws Exception {
        String json = objectMapper.writeValueAsString(event);
        ProducerRecord<String, String> record = new ProducerRecord<>("transaction-events", event.getFromAccountId(), json);
        return producer.send(record);
    }

    public void generateFraudPattern(String accountId) throws Exception {
        LOG.info("Generating fraud pattern for account: {}", accountId);

        long baseTime = System.currentTimeMillis();

        LoginEvent login1 = LoginEvent.builder()
                .accountId(accountId)
                .ipAddress("192.168.1.100")
                .timestamp(baseTime)
                .deviceId("device-001")
                .location("Beijing")
                .success(true)
                .build();
        sendLoginEvent(login1);
        LOG.info("Sent first login from IP: {}", login1.getIpAddress());

        LoginEvent login2 = LoginEvent.builder()
                .accountId(accountId)
                .ipAddress("10.0.0.50")
                .timestamp(baseTime + 1000)
                .deviceId("device-002")
                .location("Shanghai")
                .success(true)
                .build();
        sendLoginEvent(login2);
        LOG.info("Sent second login from different IP: {}", login2.getIpAddress());

        TransactionEvent largeTx = TransactionEvent.builder()
                .transactionId(UUID.randomUUID().toString())
                .fromAccountId(accountId)
                .toAccountId("account-suspicious-001")
                .amount(new BigDecimal("50000"))
                .timestamp(baseTime + 2000)
                .currency("CNY")
                .transactionType("TRANSFER")
                .merchant("Unknown")
                .location("Hong Kong")
                .build();
        sendTransactionEvent(largeTx);
        LOG.info("Sent large transaction: {}", largeTx.getAmount());

        TransactionEvent newAccountTx = TransactionEvent.builder()
                .transactionId(UUID.randomUUID().toString())
                .fromAccountId(accountId)
                .toAccountId("account-new-" + System.currentTimeMillis())
                .amount(new BigDecimal("1000"))
                .timestamp(baseTime + 3000)
                .currency("CNY")
                .transactionType("TRANSFER")
                .merchant("Unknown")
                .location("Overseas")
                .build();
        sendTransactionEvent(newAccountTx);
        LOG.info("Sent transfer to new account");

        producer.flush();
        LOG.info("Fraud pattern generation completed for account: {}", accountId);
    }

    public void generateLateLoginScenario(String accountId, long lateMs) throws Exception {
        LOG.info("Generating LATE LOGIN scenario for account: {}, late by: {}ms", accountId, lateMs);

        long baseTime = System.currentTimeMillis();

        TransactionEvent largeTx = TransactionEvent.builder()
                .transactionId(UUID.randomUUID().toString())
                .fromAccountId(accountId)
                .toAccountId("account-suspicious-001")
                .amount(new BigDecimal("50000"))
                .timestamp(baseTime)
                .currency("CNY")
                .transactionType("TRANSFER")
                .merchant("Unknown")
                .location("Hong Kong")
                .build();
        sendTransactionEvent(largeTx);
        LOG.info("Sent large transaction FIRST (before login): {}", largeTx.getAmount());

        TransactionEvent newAccountTx = TransactionEvent.builder()
                .transactionId(UUID.randomUUID().toString())
                .fromAccountId(accountId)
                .toAccountId("account-new-" + System.currentTimeMillis())
                .amount(new BigDecimal("1000"))
                .timestamp(baseTime + 1000)
                .currency("CNY")
                .transactionType("TRANSFER")
                .merchant("Unknown")
                .location("Overseas")
                .build();
        sendTransactionEvent(newAccountTx);
        LOG.info("Sent new account transfer (before login)");

        Thread.sleep(lateMs);

        LoginEvent login1 = LoginEvent.builder()
                .accountId(accountId)
                .ipAddress("192.168.1.100")
                .timestamp(baseTime - 5000)
                .deviceId("device-001")
                .location("Beijing")
                .success(true)
                .build();
        sendLoginEvent(login1);
        LOG.info("Sent LATE login #1 (timestamp -5s) from IP: {}", login1.getIpAddress());

        LoginEvent login2 = LoginEvent.builder()
                .accountId(accountId)
                .ipAddress("10.0.0.50")
                .timestamp(baseTime - 4000)
                .deviceId("device-002")
                .location("Shanghai")
                .success(true)
                .build();
        sendLoginEvent(login2);
        LOG.info("Sent LATE login #2 (timestamp -4s) from IP: {}", login2.getIpAddress());

        producer.flush();
        LOG.info("Late login scenario completed for account: {}", accountId);
    }

    public void generateOutOfOrderEvents(String accountId) throws Exception {
        LOG.info("Generating OUT-OF-ORDER events for account: {}", accountId);

        long baseTime = System.currentTimeMillis();

        LoginEvent login2 = LoginEvent.builder()
                .accountId(accountId)
                .ipAddress("10.0.0.50")
                .timestamp(baseTime + 2000)
                .deviceId("device-002")
                .location("Shanghai")
                .success(true)
                .build();
        sendLoginEvent(login2);
        LOG.info("Sent login #2 FIRST (out-of-order)");

        TransactionEvent largeTx = TransactionEvent.builder()
                .transactionId(UUID.randomUUID().toString())
                .fromAccountId(accountId)
                .toAccountId("account-suspicious-001")
                .amount(new BigDecimal("50000"))
                .timestamp(baseTime + 1000)
                .currency("CNY")
                .transactionType("TRANSFER")
                .merchant("Unknown")
                .location("Hong Kong")
                .build();
        sendTransactionEvent(largeTx);
        LOG.info("Sent large transaction (out-of-order, earlier timestamp)");

        LoginEvent login1 = LoginEvent.builder()
                .accountId(accountId)
                .ipAddress("192.168.1.100")
                .timestamp(baseTime)
                .deviceId("device-001")
                .location("Beijing")
                .success(true)
                .build();
        sendLoginEvent(login1);
        LOG.info("Sent login #1 LAST (earlier timestamp)");

        TransactionEvent newAccountTx = TransactionEvent.builder()
                .transactionId(UUID.randomUUID().toString())
                .fromAccountId(accountId)
                .toAccountId("account-new-" + System.currentTimeMillis())
                .amount(new BigDecimal("1000"))
                .timestamp(baseTime + 3000)
                .currency("CNY")
                .transactionType("TRANSFER")
                .merchant("Unknown")
                .location("Overseas")
                .build();
        sendTransactionEvent(newAccountTx);
        LOG.info("Sent transfer to new account (in order)");

        producer.flush();
        LOG.info("Out-of-order events generation completed for account: {}", accountId);
    }

    public void generateNormalActivity(String accountId) throws Exception {
        LOG.info("Generating normal activity for account: {}", accountId);

        long baseTime = System.currentTimeMillis();

        LoginEvent login = LoginEvent.builder()
                .accountId(accountId)
                .ipAddress("192.168.1.100")
                .timestamp(baseTime)
                .deviceId("device-normal")
                .location("Beijing")
                .success(true)
                .build();
        sendLoginEvent(login);

        Thread.sleep(2000);

        TransactionEvent tx = TransactionEvent.builder()
                .transactionId(UUID.randomUUID().toString())
                .fromAccountId(accountId)
                .toAccountId("account-regular-001")
                .amount(new BigDecimal("500"))
                .timestamp(baseTime + 2000)
                .currency("CNY")
                .transactionType("PURCHASE")
                .merchant("Regular Store")
                .location("Beijing")
                .build();
        sendTransactionEvent(tx);

        producer.flush();
    }

    public void close() {
        producer.close();
    }

    public static void main(String[] args) throws Exception {
        TestDataGenerator generator = new TestDataGenerator("localhost:9092");

        LOG.info("Test Data Generator started");
        LOG.info("Generating test scenarios:");
        LOG.info("  - Normal activity (30%)");
        LOG.info("  - Normal fraud pattern (30%)");
        LOG.info("  - Late login scenarios (20%)");
        LOG.info("  - Out-of-order events (20%)");

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOG.info("Shutting down Test Data Generator...");
            generator.close();
        }));

        int fraudCount = 0;
        int normalCount = 0;
        int lateLoginCount = 0;
        int outOfOrderCount = 0;

        while (true) {
            String accountId = "account-" + System.currentTimeMillis();
            double rand = Math.random();

            if (rand < 0.3) {
                generator.generateNormalActivity(accountId);
                normalCount++;
            } else if (rand < 0.6) {
                generator.generateFraudPattern(accountId);
                fraudCount++;
            } else if (rand < 0.8) {
                generator.generateLateLoginScenario(accountId, 5000);
                lateLoginCount++;
            } else {
                generator.generateOutOfOrderEvents(accountId);
                outOfOrderCount++;
            }

            LOG.info("Generated - Normal: {}, Fraud: {}, Late Login: {}, Out-of-Order: {}",
                    normalCount, fraudCount, lateLoginCount, outOfOrderCount);
            Thread.sleep(8000);
        }
    }
}
