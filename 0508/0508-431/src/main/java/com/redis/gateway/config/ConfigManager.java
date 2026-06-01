package com.redis.gateway.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

public class ConfigManager {
    private static final Logger logger = LoggerFactory.getLogger(ConfigManager.class);
    private static final String DEFAULT_CONFIG_PATH = "gateway-config.json";

    private final ObjectMapper objectMapper;
    private final AtomicReference<GatewayConfig> configRef;
    private final List<ConfigChangeListener> listeners;
    private final ScheduledExecutorService scheduler;
    private final String configPath;
    private final BusinessGroupMatcher businessGroupMatcher;
    private volatile long lastModified = -1;

    public ConfigManager() {
        this(DEFAULT_CONFIG_PATH);
    }

    public ConfigManager(String configPath) {
        this.configPath = configPath;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.configRef = new AtomicReference<>();
        this.listeners = new CopyOnWriteArrayList<>();
        this.businessGroupMatcher = new BusinessGroupMatcher();
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "config-reloader");
            t.setDaemon(true);
            return t;
        });
        loadConfig();
    }

    private void loadConfig() {
        try {
            GatewayConfig config = loadConfigFromFile();
            if (config == null) {
                config = loadConfigFromClasspath();
            }
            if (config == null) {
                throw new RuntimeException("Cannot load configuration from: " + configPath);
            }
            configRef.set(config);
            businessGroupMatcher.loadBusinessGroups(config.getBusinessGroups());
            logger.info("Configuration loaded successfully");
        } catch (Exception e) {
            logger.error("Failed to load configuration", e);
            throw new RuntimeException("Failed to load configuration", e);
        }
    }

    private GatewayConfig loadConfigFromFile() throws IOException {
        Path path = Paths.get(configPath);
        if (Files.exists(path)) {
            lastModified = Files.getLastModifiedTime(path).toMillis();
            return objectMapper.readValue(path.toFile(), GatewayConfig.class);
        }
        return null;
    }

    private GatewayConfig loadConfigFromClasspath() throws IOException {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(configPath)) {
            if (is != null) {
                return objectMapper.readValue(is, GatewayConfig.class);
            }
        }
        return null;
    }

    public GatewayConfig getConfig() {
        return configRef.get();
    }

    public void startHotReload() {
        GatewayConfig config = getConfig();
        if (config.getHotReload() != null && config.getHotReload().isEnabled()) {
            int intervalMs = config.getHotReload().getIntervalMs();
            scheduler.scheduleAtFixedRate(this::checkAndReload, intervalMs, intervalMs, TimeUnit.MILLISECONDS);
            logger.info("Hot reload enabled, interval: {} ms", intervalMs);
        }
    }

    private void checkAndReload() {
        try {
            Path path = Paths.get(configPath);
            if (!Files.exists(path)) {
                return;
            }
            long currentModified = Files.getLastModifiedTime(path).toMillis();
            if (currentModified > lastModified) {
                logger.info("Config file changed, reloading...");
                GatewayConfig newConfig = objectMapper.readValue(path.toFile(), GatewayConfig.class);
                GatewayConfig oldConfig = configRef.getAndSet(newConfig);
                lastModified = currentModified;
                businessGroupMatcher.loadBusinessGroups(newConfig.getBusinessGroups());
                notifyListeners(oldConfig, newConfig);
                logger.info("Configuration reloaded successfully");
            }
        } catch (Exception e) {
            logger.error("Failed to reload configuration", e);
        }
    }

    public void addListener(ConfigChangeListener listener) {
        listeners.add(listener);
    }

    public void removeListener(ConfigChangeListener listener) {
        listeners.remove(listener);
    }

    private void notifyListeners(GatewayConfig oldConfig, GatewayConfig newConfig) {
        for (ConfigChangeListener listener : listeners) {
            try {
                listener.onConfigChange(oldConfig, newConfig);
            } catch (Exception e) {
                logger.error("Error notifying config change listener", e);
            }
        }
    }

    public void shutdown() {
        scheduler.shutdownNow();
    }

    public interface ConfigChangeListener {
        void onConfigChange(GatewayConfig oldConfig, GatewayConfig newConfig);
    }

    public GatewayConfig.ClusterConfig getClusterConfig(String clusterId) {
        for (GatewayConfig.ClusterConfig cluster : getConfig().getClusters()) {
            if (cluster.getId().equals(clusterId)) {
                return cluster;
            }
        }
        return null;
    }

    public GatewayConfig.BusinessGroupConfig getBusinessGroup(String key) {
        return businessGroupMatcher.match(key);
    }

    public List<GatewayConfig.ClusterConfig> getBusinessGroupClusters(String key) {
        GatewayConfig.BusinessGroupConfig businessGroup = getBusinessGroup(key);
        if (businessGroup == null) {
            return getConfig().getClusters();
        }
        List<GatewayConfig.ClusterConfig> result = new ArrayList<>();
        for (String clusterId : businessGroup.getClusters()) {
            GatewayConfig.ClusterConfig cluster = getClusterConfig(clusterId);
            if (cluster != null) {
                result.add(cluster);
            }
        }
        return result;
    }

    public BusinessGroupMatcher getBusinessGroupMatcher() {
        return businessGroupMatcher;
    }
}
