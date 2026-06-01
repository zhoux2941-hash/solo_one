package com.monitor.kernel;

import org.osgi.framework.BundleContext;
import com.monitor.api.ConfigService;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

public class ConfigCenter implements ConfigService {
    private final BundleContext bundleContext;
    private Connection dbConnection;
    private final Map<String, Consumer<Map<String, String>>> listeners = new ConcurrentHashMap<>();
    private final Map<String, Map<String, String>> configCache = new ConcurrentHashMap<>();
    private ScheduledExecutorService poller;
    private ScheduledFuture<?> pollTask;

    public ConfigCenter(BundleContext context) {
        this.bundleContext = context;
    }

    public void open() throws Exception {
        String dbPath = bundleContext.getProperty("monitor.db.path");
        if (dbPath == null) dbPath = "./monitor_config";
        dbConnection = DriverManager.getConnection("jdbc:h2:" + dbPath + ";AUTO_SERVER=TRUE");
        try (Statement stmt = dbConnection.createStatement()) {
            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS plugin_config (" +
                "plugin_id VARCHAR(255) NOT NULL, " +
                "config_key VARCHAR(255) NOT NULL, " +
                "config_value VARCHAR(1024) NOT NULL, " +
                "PRIMARY KEY (plugin_id, config_key))");
        }
        seedDefaultConfigs();
        refreshAllCache();
        startPoller();
    }

    private void seedDefaultConfigs() {
        ensureConfig("cpu", "enabled", "true");
        ensureConfig("cpu", "interval_ms", "5000");
        ensureConfig("cpu", "alert.threshold.usage", "90.0");
        ensureConfig("cpu", "alert.threshold.temperature", "85.0");
        ensureConfig("memory", "enabled", "true");
        ensureConfig("memory", "interval_ms", "5000");
        ensureConfig("memory", "alert.threshold.usage_percent", "90.0");
        ensureConfig("disk", "enabled", "true");
        ensureConfig("disk", "interval_ms", "5000");
        ensureConfig("disk", "alert.threshold.usage_percent", "90.0");
    }

    private void ensureConfig(String pluginId, String key, String value) {
        try (PreparedStatement ps = dbConnection.prepareStatement(
                "MERGE INTO plugin_config KEY(plugin_id, config_key) VALUES(?, ?, ?)")) {
            ps.setString(1, pluginId);
            ps.setString(2, key);
            ps.setString(3, value);
            ps.executeUpdate();
        } catch (Exception e) {
            System.err.println("[CONFIG] Failed to seed config: " + e.getMessage());
        }
    }

    private void startPoller() {
        poller = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "config-poller");
            t.setDaemon(true);
            return t;
        });
        pollTask = poller.scheduleAtFixedRate(this::checkAndNotifyChanges, 3, 3, TimeUnit.SECONDS);
        System.out.println("[CONFIG] Started config poller (3s interval)");
    }

    private void refreshAllCache() {
        try (Statement stmt = dbConnection.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT DISTINCT plugin_id FROM plugin_config")) {
            while (rs.next()) {
                String pluginId = rs.getString("plugin_id");
                configCache.put(pluginId, loadConfigFromDb(pluginId));
            }
        } catch (Exception e) {
            System.err.println("[CONFIG] Error refreshing cache: " + e.getMessage());
        }
    }

    private Map<String, String> loadConfigFromDb(String pluginId) {
        Map<String, String> config = new HashMap<>();
        try (PreparedStatement ps = dbConnection.prepareStatement(
                "SELECT config_key, config_value FROM plugin_config WHERE plugin_id = ?")) {
            ps.setString(1, pluginId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    config.put(rs.getString("config_key"), rs.getString("config_value"));
                }
            }
        } catch (Exception e) {
            System.err.println("[CONFIG] Error loading config for " + pluginId + ": " + e.getMessage());
        }
        return config;
    }

    private void checkAndNotifyChanges() {
        try (Statement stmt = dbConnection.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT DISTINCT plugin_id FROM plugin_config")) {
            while (rs.next()) {
                String pluginId = rs.getString("plugin_id");
                Map<String, String> oldConfig = configCache.get(pluginId);
                Map<String, String> newConfig = loadConfigFromDb(pluginId);
                if (oldConfig == null || !oldConfig.equals(newConfig)) {
                    configCache.put(pluginId, newConfig);
                    Consumer<Map<String, String>> listener = listeners.get(pluginId);
                    if (listener != null) {
                        System.out.println("[CONFIG] Detected change for plugin: " + pluginId);
                        try {
                            listener.accept(newConfig);
                        } catch (Exception e) {
                            System.err.println("[CONFIG] Listener error for " + pluginId + ": " + e.getMessage());
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[CONFIG] Poller error: " + e.getMessage());
        }
    }

    public void close() {
        if (pollTask != null) pollTask.cancel(false);
        if (poller != null) {
            poller.shutdownNow();
            try {
                poller.awaitTermination(3, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        try {
            if (dbConnection != null && !dbConnection.isClosed()) dbConnection.close();
        } catch (Exception e) {
            System.err.println("[CONFIG] Error closing DB: " + e.getMessage());
        }
    }

    @Override
    public Map<String, String> getConfig(String pluginId) {
        Map<String, String> cached = configCache.get(pluginId);
        if (cached != null) {
            return new HashMap<>(cached);
        }
        Map<String, String> config = loadConfigFromDb(pluginId);
        configCache.put(pluginId, config);
        return new HashMap<>(config);
    }

    @Override
    public void updateConfig(String pluginId, Map<String, String> config) {
        try {
            dbConnection.setAutoCommit(false);
            try (PreparedStatement del = dbConnection.prepareStatement(
                    "DELETE FROM plugin_config WHERE plugin_id = ?")) {
                del.setString(1, pluginId);
                del.executeUpdate();
            }
            try (PreparedStatement ins = dbConnection.prepareStatement(
                    "INSERT INTO plugin_config(plugin_id, config_key, config_value) VALUES(?, ?, ?)")) {
                for (Map.Entry<String, String> entry : config.entrySet()) {
                    ins.setString(1, pluginId);
                    ins.setString(2, entry.getKey());
                    ins.setString(3, entry.getValue());
                    ins.executeUpdate();
                }
            }
            dbConnection.commit();
        } catch (Exception e) {
            try { dbConnection.rollback(); } catch (Exception ignored) {}
            System.err.println("[CONFIG] Error updating config: " + e.getMessage());
        } finally {
            try { dbConnection.setAutoCommit(true); } catch (Exception ignored) {}
        }
        configCache.put(pluginId, new HashMap<>(config));
        Consumer<Map<String, String>> listener = listeners.get(pluginId);
        if (listener != null) {
            listener.accept(new HashMap<>(config));
        }
    }

    @Override
    public void registerConfigListener(String pluginId, Consumer<Map<String, String>> listener) {
        listeners.put(pluginId, listener);
    }

    @Override
    public void unregisterConfigListener(String pluginId) {
        listeners.remove(pluginId);
    }

    @Override
    public boolean isPluginEnabled(String pluginId) {
        return "true".equalsIgnoreCase(getConfig(pluginId).getOrDefault("enabled", "true"));
    }

    @Override
    public long getCollectInterval(String pluginId, long defaultMs) {
        String val = getConfig(pluginId).get("interval_ms");
        if (val != null) {
            try { return Long.parseLong(val); } catch (NumberFormatException ignored) {}
        }
        return defaultMs;
    }

    @Override
    public double getAlertThreshold(String pluginId, String metricKey, double defaultValue) {
        String val = getConfig(pluginId).get("alert.threshold." + metricKey);
        if (val != null) {
            try { return Double.parseDouble(val); } catch (NumberFormatException ignored) {}
        }
        return defaultValue;
    }
}
