package com.redis.gateway.cluster;

import com.redis.gateway.config.ConfigManager;
import com.redis.gateway.config.GatewayConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class ClusterManager {
    private static final Logger logger = LoggerFactory.getLogger(ClusterManager.class);

    private final ConfigManager configManager;
    private final Map<String, RedisClusterClient> clusters;
    private final ScheduledExecutorService healthCheckScheduler;

    public ClusterManager(ConfigManager configManager) {
        this.configManager = configManager;
        this.clusters = new ConcurrentHashMap<>();
        this.healthCheckScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "health-check");
            t.setDaemon(true);
            return t;
        });
        initializeClusters();
    }

    private void initializeClusters() {
        GatewayConfig config = configManager.getConfig();
        for (GatewayConfig.ClusterConfig clusterConfig : config.getClusters()) {
            addCluster(clusterConfig);
        }
        logger.info("Initialized {} clusters", clusters.size());
    }

    public void addCluster(GatewayConfig.ClusterConfig clusterConfig) {
        if (!clusters.containsKey(clusterConfig.getId())) {
            RedisClusterClient client = new RedisClusterClient(clusterConfig);
            clusters.put(clusterConfig.getId(), client);
            logger.info("Added cluster: {}", clusterConfig.getId());
        }
    }

    public void removeCluster(String clusterId) {
        RedisClusterClient client = clusters.remove(clusterId);
        if (client != null) {
            client.close();
            logger.info("Removed cluster: {}", clusterId);
        }
    }

    public RedisClusterClient getCluster(String clusterId) {
        return clusters.get(clusterId);
    }

    public List<RedisClusterClient> getAllClusters() {
        return new ArrayList<>(clusters.values());
    }

    public List<RedisClusterClient> getHealthyClusters() {
        List<RedisClusterClient> healthy = new ArrayList<>();
        for (RedisClusterClient client : clusters.values()) {
            if (client.isHealthy()) {
                healthy.add(client);
            }
        }
        return healthy;
    }

    public List<RedisClusterClient> getClustersForBusinessKey(String key) {
        List<GatewayConfig.ClusterConfig> configs = configManager.getBusinessGroupClusters(key);
        List<RedisClusterClient> clients = new ArrayList<>();
        for (GatewayConfig.ClusterConfig config : configs) {
            RedisClusterClient client = clusters.get(config.getId());
            if (client != null) {
                clients.add(client);
            }
        }
        return clients;
    }

    public List<RedisClusterClient> getHealthyClustersForBusinessKey(String key) {
        List<RedisClusterClient> clients = getClustersForBusinessKey(key);
        List<RedisClusterClient> healthy = new ArrayList<>();
        for (RedisClusterClient client : clients) {
            if (client.isHealthy()) {
                healthy.add(client);
            }
        }
        return healthy;
    }

    public RedisClusterClient getLocalCluster() {
        String localRegion = configManager.getConfig().getGateway().getLocalRegion();
        for (RedisClusterClient client : clusters.values()) {
            if (client.getRegion().equals(localRegion)) {
                return client;
            }
        }
        return null;
    }

    public void startHealthCheck() {
        GatewayConfig config = configManager.getConfig();
        if (config.getHealthCheck() != null) {
            int intervalMs = config.getHealthCheck().getIntervalMs();
            healthCheckScheduler.scheduleAtFixedRate(this::checkHealth, 0, intervalMs, TimeUnit.MILLISECONDS);
            logger.info("Health check started, interval: {} ms", intervalMs);
        }
    }

    private void checkHealth() {
        GatewayConfig config = configManager.getConfig();
        GatewayConfig.HealthCheckConfig hcConfig = config.getHealthCheck();
        int failureThreshold = hcConfig.getFailureThreshold();
        int successThreshold = hcConfig.getSuccessThreshold();

        for (RedisClusterClient client : clusters.values()) {
            boolean pingSuccess = client.ping();
            if (pingSuccess) {
                if (!client.isHealthy() && client.getSuccessCount() >= successThreshold) {
                    client.setHealthy(true);
                    logger.info("Cluster {} recovered and marked as healthy", client.getClusterId());
                }
            } else {
                if (client.isHealthy() && client.getFailureCount() >= failureThreshold) {
                    client.setHealthy(false);
                    logger.warn("Cluster {} marked as unhealthy ({} consecutive failures)",
                            client.getClusterId(), client.getFailureCount());
                }
            }
        }
    }

    public void onConfigChange(GatewayConfig oldConfig, GatewayConfig newConfig) {
        logger.info("Configuration changed, updating cluster manager");

        Map<String, GatewayConfig.ClusterConfig> newClusterMap = new ConcurrentHashMap<>();
        for (GatewayConfig.ClusterConfig config : newConfig.getClusters()) {
            newClusterMap.put(config.getId(), config);
        }

        for (String clusterId : clusters.keySet()) {
            if (!newClusterMap.containsKey(clusterId)) {
                removeCluster(clusterId);
            }
        }

        for (GatewayConfig.ClusterConfig config : newConfig.getClusters()) {
            addCluster(config);
        }
    }

    public void shutdown() {
        healthCheckScheduler.shutdownNow();
        for (RedisClusterClient client : clusters.values()) {
            client.close();
        }
        clusters.clear();
        logger.info("Cluster manager shutdown complete");
    }
}
