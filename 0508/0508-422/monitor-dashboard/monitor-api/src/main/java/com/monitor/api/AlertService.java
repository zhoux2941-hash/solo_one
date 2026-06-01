package com.monitor.api;

public interface AlertService {
    void fireAlert(String pluginId, String metricKey, double value, double threshold);
    boolean isAlertActive(String pluginId, String metricKey);
}
