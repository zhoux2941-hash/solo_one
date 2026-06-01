package com.monitor.api;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class PluginMonitorData implements MonitorData {
    private final String pluginType;
    private final Instant timestamp;
    private final Map<String, Object> metrics;

    public PluginMonitorData(String pluginType, Map<String, Object> metrics) {
        this.pluginType = pluginType;
        this.timestamp = Instant.now();
        this.metrics = Collections.unmodifiableMap(new HashMap<>(metrics));
    }

    @Override
    public String getPluginType() { return pluginType; }

    @Override
    public Instant getTimestamp() { return timestamp; }

    @Override
    public Map<String, Object> getMetrics() { return metrics; }

    @Override
    public String toString() {
        return "PluginMonitorData{pluginType='" + pluginType + "', timestamp=" + timestamp + ", metrics=" + metrics + '}';
    }
}
