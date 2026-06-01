package com.monitor.plugin.disk;

import org.osgi.framework.BundleContext;
import org.osgi.service.log.LogService;
import com.monitor.api.*;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class DiskMonitorPlugin implements MonitorPlugin {
    private final BundleContext bundleContext;
    private final ConfigService configService;
    private final EventPublisher eventPublisher;
    private final AlertService alertService;
    private final LogService logService;
    private volatile boolean running = false;
    private volatile boolean destroyed = false;
    private ScheduledExecutorService scheduler;
    private ScheduledFuture<?> collectTask;
    private long intervalMs = 5000;
    private final DiskDataCollector dataCollector = new DiskDataCollector();

    public DiskMonitorPlugin(BundleContext context, ConfigService configService,
                              EventPublisher eventPublisher, AlertService alertService,
                              LogService logService) {
        this.bundleContext = context;
        this.configService = configService;
        this.eventPublisher = eventPublisher;
        this.alertService = alertService;
        this.logService = logService;
    }

    @Override
    public String getName() { return "Disk Monitor"; }

    @Override
    public String getType() { return "disk"; }

    @Override
    public synchronized void start() {
        if (destroyed) return;
        if (running) return;
        if (configService != null) {
            intervalMs = configService.getCollectInterval("disk", 5000);
            configService.registerConfigListener("disk", this::onConfigChanged);
            if (!configService.isPluginEnabled("disk")) {
                log(LogService.LOG_INFO, "Plugin disabled by configuration");
                return;
            }
        }
        long bundleId = bundleContext.getBundle().getBundleId();
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "disk-monitor-" + bundleId);
            t.setDaemon(true);
            return t;
        });
        collectTask = scheduler.scheduleAtFixedRate(this::collect, 0, intervalMs, TimeUnit.MILLISECONDS);
        running = true;
        log(LogService.LOG_INFO, "Started with interval=" + intervalMs + "ms");
    }

    @Override
    public synchronized void stop() {
        destroyed = true;
        if (collectTask != null) {
            collectTask.cancel(true);
            collectTask = null;
        }
        if (scheduler != null) {
            scheduler.shutdownNow();
            try {
                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    log(LogService.LOG_WARNING, "Scheduler did not terminate within 5s");
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            scheduler = null;
        }
        if (configService != null) configService.unregisterConfigListener("disk");
        running = false;
        log(LogService.LOG_INFO, "Stopped");
    }

    @Override
    public boolean isRunning() { return running; }

    private synchronized void onConfigChanged(Map<String, String> newConfig) {
        if (destroyed) return;
        boolean isEnabledNow = configService.isPluginEnabled("disk");
        long newInterval = configService.getCollectInterval("disk", 5000);
        if (running && newInterval != intervalMs) {
            intervalMs = newInterval;
            if (collectTask != null) collectTask.cancel(false);
            collectTask = scheduler.scheduleAtFixedRate(this::collect, 0, intervalMs, TimeUnit.MILLISECONDS);
            log(LogService.LOG_INFO, "Interval changed to " + intervalMs + "ms (hot reload)");
        }
        if (running && !isEnabledNow) {
            running = false;
            if (collectTask != null) {
                collectTask.cancel(true);
                collectTask = null;
            }
            if (scheduler != null) {
                scheduler.shutdownNow();
                try {
                    scheduler.awaitTermination(5, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                scheduler = null;
            }
            log(LogService.LOG_INFO, "Disabled by configuration (hot reload)");
        } else if (!running && isEnabledNow) {
            start();
            log(LogService.LOG_INFO, "Enabled by configuration (hot reload)");
        }
    }

    private void collect() {
        if (destroyed || !running) return;
        try {
            Map<String, Object> metrics = dataCollector.collect();
            if (destroyed || !running) return;
            MonitorData data = new PluginMonitorData("disk", metrics);
            if (eventPublisher != null) {
                Map<String, Object> eventData = new HashMap<>();
                eventData.put("monitor.data", data);
                eventPublisher.publish("com/monitor/disk/data", "disk", eventData);
            }
            checkAlerts(metrics);
            log(LogService.LOG_DEBUG, "Collected: " + metrics);
        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            if (!destroyed) {
                log(LogService.LOG_ERROR, "Collection error: " + e.getMessage());
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void checkAlerts(Map<String, Object> metrics) {
        if (alertService == null || configService == null) return;
        Object partitions = metrics.get("disk.partitions");
        if (partitions instanceof Map) {
            Map<String, Map<String, Object>> partMap = (Map<String, Map<String, Object>>) partitions;
            for (Map.Entry<String, Map<String, Object>> entry : partMap.entrySet()) {
                double usagePercent = toDouble(entry.getValue().get("usage_percent"), 0);
                double threshold = configService.getAlertThreshold("disk", "usage_percent", 90.0);
                if (usagePercent > threshold) {
                    alertService.fireAlert("disk", "usage_percent_" + entry.getKey(), usagePercent, threshold);
                }
            }
        }
    }

    private double toDouble(Object val, double def) {
        if (val instanceof Number) return ((Number) val).doubleValue();
        if (val instanceof String) {
            try { return Double.parseDouble((String) val); } catch (Exception e) { return def; }
        }
        return def;
    }

    private void log(int level, String message) {
        if (logService != null) {
            logService.log(level, "[DISK][BundleID=" + bundleContext.getBundle().getBundleId() + "] " + message);
        } else {
            System.out.println("[DISK] " + message);
        }
    }
}
