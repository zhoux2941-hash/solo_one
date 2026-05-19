package com.antifraud.source;

import com.antifraud.model.LoginEvent;
import com.antifraud.model.TransactionEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.api.common.typeinfo.TypeHint;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.streaming.connectors.kafka.KafkaDeserializationSchema;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KafkaDeserializationSchema<T> implements KafkaDeserializationSchema<T> {
    private static final Logger LOG = LoggerFactory.getLogger(KafkaDeserializationSchema.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final Class<T> clazz;

    public KafkaDeserializationSchema(Class<T> clazz) {
        this.clazz = clazz;
    }

    @Override
    public void open(org.apache.flink.configuration.Configuration parameters) throws Exception {
        KafkaDeserializationSchema.super.open(parameters);
    }

    @Override
    public T deserialize(ConsumerRecord<byte[], byte[]> record) throws Exception {
        try {
            String value = new String(record.value(), "UTF-8");
            if (clazz == LoginEvent.class) {
                return clazz.cast(objectMapper.readValue(value, LoginEvent.class));
            } else if (clazz == TransactionEvent.class) {
                return clazz.cast(objectMapper.readValue(value, TransactionEvent.class));
            }
            return objectMapper.readValue(value, clazz);
        } catch (Exception e) {
            LOG.error("Failed to deserialize Kafka message: {}", new String(record.value()), e);
            return null;
        }
    }

    @Override
    public boolean isEndOfStream(T nextElement) {
        return false;
    }

    @Override
    public TypeInformation<T> getProducedType() {
        return TypeInformation.of(new TypeHint<T>() {
            @Override
            public TypeInformation<T> getTypeInfo() {
                return TypeInformation.of(clazz);
            }
        });
    }
}
