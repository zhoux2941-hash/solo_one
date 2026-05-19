package com.antifraud.sink;

import com.antifraud.model.AlertEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.api.common.functions.RuntimeContext;
import org.apache.flink.streaming.connectors.elasticsearch.ElasticsearchSinkFunction;
import org.apache.flink.streaming.connectors.elasticsearch.RequestIndexer;
import org.apache.http.HttpHost;
import org.elasticsearch.client.Requests;
import org.elasticsearch.common.xcontent.XContentType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ElasticsearchSink {
    private static final Logger LOG = LoggerFactory.getLogger(ElasticsearchSink.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static org.apache.flink.streaming.connectors.elasticsearch7.ElasticsearchSink<AlertEvent> createElasticsearchSink(
            List<HttpHost> httpHosts, String indexName) {

        ElasticsearchSinkFunction<AlertEvent> elasticsearchSinkFunction =
                new ElasticsearchSinkFunction<AlertEvent>() {
                    @Override
                    public void process(AlertEvent alert, RuntimeContext ctx, RequestIndexer indexer) {
                        try {
                            Map<String, Object> document = buildDocument(alert);
                            String json = objectMapper.writeValueAsString(document);

                            indexer.add(Requests.indexRequest()
                                    .index(indexName)
                                    .id(alert.getAlertId())
                                    .source(json, XContentType.JSON));

                            LOG.debug("Indexed alert to Elasticsearch: {}", alert.getAlertId());
                        } catch (Exception e) {
                            LOG.error("Failed to index alert to Elasticsearch", e);
                        }
                    }
                };

        return new org.apache.flink.streaming.connectors.elasticsearch7.ElasticsearchSink.Builder<>(
                httpHosts, elasticsearchSinkFunction)
                .setBulkFlushMaxActions(100)
                .setBulkFlushInterval(1000L)
                .setBulkFlushMaxSizeMb(1)
                .build();
    }

    private static Map<String, Object> buildDocument(AlertEvent alert) {
        Map<String, Object> doc = new HashMap<>();
        doc.put("alertId", alert.getAlertId());
        doc.put("accountId", alert.getAccountId());
        doc.put("alertType", alert.getAlertType().name());
        doc.put("alertLevel", alert.getAlertLevel().name());
        doc.put("timestamp", alert.getTimestamp());
        doc.put("description", alert.getDescription());
        doc.put("ipAddresses", alert.getIpAddresses());
        doc.put("transactionAmount", alert.getTransactionAmount() != null ? alert.getTransactionAmount().doubleValue() : null);
        doc.put("toAccountId", alert.getToAccountId());
        doc.put("ruleId", alert.getRuleId());
        doc.put("ruleName", alert.getRuleName());
        doc.put("detectionTimeMs", alert.getDetectionTimeMs());
        return doc;
    }
}
