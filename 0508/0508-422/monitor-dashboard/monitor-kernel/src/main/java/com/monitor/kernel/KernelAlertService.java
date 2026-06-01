package com.monitor.kernel;

import com.monitor.api.AlertService;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class KernelAlertService implements AlertService {
    private final ConfigCenter configCenter;
    private final Map<String, Boolean> activeAlerts = new ConcurrentHashMap<>();

    public KernelAlertService(ConfigCenter configCenter) {
        this.configCenter = configCenter;
    }

    @Override
    public void fireAlert(String pluginId, String metricKey, double value, double threshold) {
        String key = pluginId + ":" + metricKey;
        if (!activeAlerts.containsKey(key) || !activeAlerts.get(key)) {
            activeAlerts.put(key, true);
            System.out.println("[ALERT] [" + pluginId + "] " + metricKey +
                " exceeded threshold: value=" + value + ", threshold=" + threshold);
        }
    }

    @Override
    public boolean isAlertActive(String pluginId, String metricKey) {
        return activeAlerts.getOrDefault(pluginId + ":" + metricKey, false);
    }
}
