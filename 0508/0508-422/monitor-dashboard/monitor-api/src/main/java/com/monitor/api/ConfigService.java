package com.monitor.api;

import java.util.Map;
import java.util.function.Consumer;

public interface ConfigService {
    Map<String, String> getConfig(String pluginId);
    void updateConfig(String pluginId, Map<String, String> config);
    void registerConfigListener(String pluginId, Consumer<Map<String, String>> listener);
    void unregisterConfigListener(String pluginId);
    boolean isPluginEnabled(String pluginId);
    long getCollectInterval(String pluginId, long defaultMs);
    double getAlertThreshold(String pluginId, String metricKey, double defaultValue);
}
