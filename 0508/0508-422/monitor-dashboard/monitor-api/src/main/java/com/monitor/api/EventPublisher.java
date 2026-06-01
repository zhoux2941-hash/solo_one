package com.monitor.api;

import java.util.Map;

public interface EventPublisher {
    void publish(String topic, Map<String, Object> data);
    void publish(String topic, String pluginId, Map<String, Object> data);
}
