package com.monitor.api;

import java.time.Instant;
import java.util.Map;

public interface MonitorData {
    String getPluginType();
    Instant getTimestamp();
    Map<String, Object> getMetrics();
}
