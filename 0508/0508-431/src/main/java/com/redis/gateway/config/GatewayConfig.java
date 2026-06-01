package com.redis.gateway.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class GatewayConfig {

    private GatewaySettings gateway;
    private List<ClusterConfig> clusters;
    private List<BusinessGroupConfig> businessGroups;
    private ReplicationConfig replication;
    private HealthCheckConfig healthCheck;
    private HotReloadConfig hotReload;

    public GatewaySettings getGateway() { return gateway; }
    public void setGateway(GatewaySettings gateway) { this.gateway = gateway; }
    public List<ClusterConfig> getClusters() { return clusters; }
    public void setClusters(List<ClusterConfig> clusters) { this.clusters = clusters; }
    public List<BusinessGroupConfig> getBusinessGroups() { return businessGroups; }
    public void setBusinessGroups(List<BusinessGroupConfig> businessGroups) { this.businessGroups = businessGroups; }
    public ReplicationConfig getReplication() { return replication; }
    public void setReplication(ReplicationConfig replication) { this.replication = replication; }
    public HealthCheckConfig getHealthCheck() { return healthCheck; }
    public void setHealthCheck(HealthCheckConfig healthCheck) { this.healthCheck = healthCheck; }
    public HotReloadConfig getHotReload() { return hotReload; }
    public void setHotReload(HotReloadConfig hotReload) { this.hotReload = hotReload; }

    public static class GatewaySettings {
        private int port = 6379;
        private int managementPort = 8080;
        private int bossThreads = 2;
        private int workerThreads = 16;
        private String localRegion = "beijing";
        private String instanceId;

        public int getPort() { return port; }
        public void setPort(int port) { this.port = port; }
        public int getManagementPort() { return managementPort; }
        public void setManagementPort(int managementPort) { this.managementPort = managementPort; }
        public int getBossThreads() { return bossThreads; }
        public void setBossThreads(int bossThreads) { this.bossThreads = bossThreads; }
        public int getWorkerThreads() { return workerThreads; }
        public void setWorkerThreads(int workerThreads) { this.workerThreads = workerThreads; }
        public String getLocalRegion() { return localRegion; }
        public void setLocalRegion(String localRegion) { this.localRegion = localRegion; }
        public String getInstanceId() { return instanceId; }
        public void setInstanceId(String instanceId) { this.instanceId = instanceId; }
    }

    public static class ClusterConfig {
        private String id;
        private String name;
        private String region;
        private List<String> nodes;
        private String password;
        private int database = 0;
        private int timeoutMs = 2000;
        private int maxPoolSize = 100;
        private int minIdle = 10;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getRegion() { return region; }
        public void setRegion(String region) { this.region = region; }
        public List<String> getNodes() { return nodes; }
        public void setNodes(List<String> nodes) { this.nodes = nodes; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public int getDatabase() { return database; }
        public void setDatabase(int database) { this.database = database; }
        public int getTimeoutMs() { return timeoutMs; }
        public void setTimeoutMs(int timeoutMs) { this.timeoutMs = timeoutMs; }
        public int getMaxPoolSize() { return maxPoolSize; }
        public void setMaxPoolSize(int maxPoolSize) { this.maxPoolSize = maxPoolSize; }
        public int getMinIdle() { return minIdle; }
        public void setMinIdle(int minIdle) { this.minIdle = minIdle; }
    }

    public static class BusinessGroupConfig {
        private String name;
        private List<String> prefixes;
        private List<String> clusters;
        private ReadPreference readPreference = ReadPreference.LOCAL_FIRST;
        private WriteConsistency writeConsistency = WriteConsistency.ALL;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public List<String> getPrefixes() { return prefixes; }
        public void setPrefixes(List<String> prefixes) { this.prefixes = prefixes; }
        public List<String> getClusters() { return clusters; }
        public void setClusters(List<String> clusters) { this.clusters = clusters; }
        public ReadPreference getReadPreference() { return readPreference; }
        public void setReadPreference(ReadPreference readPreference) { this.readPreference = readPreference; }
        public WriteConsistency getWriteConsistency() { return writeConsistency; }
        public void setWriteConsistency(WriteConsistency writeConsistency) { this.writeConsistency = writeConsistency; }
    }

    public enum ReadPreference {
        @JsonProperty("LOCAL_FIRST")
        LOCAL_FIRST,
        @JsonProperty("RANDOM")
        RANDOM,
        @JsonProperty("CONSISTENCY_CHECK")
        CONSISTENCY_CHECK
    }

    public enum WriteConsistency {
        @JsonProperty("ALL")
        ALL,
        @JsonProperty("MAJORITY")
        MAJORITY
    }

    public static class ReplicationConfig {
        private boolean walEnabled = true;
        private String walPath = "./data/wal";
        private long walMaxSize = 1073741824L;
        private int retryIntervalMs = 1000;
        private int maxRetryAttempts = 3;
        private int recoveryBatchSize = 100;

        public boolean isWalEnabled() { return walEnabled; }
        public void setWalEnabled(boolean walEnabled) { this.walEnabled = walEnabled; }
        public String getWalPath() { return walPath; }
        public void setWalPath(String walPath) { this.walPath = walPath; }
        public long getWalMaxSize() { return walMaxSize; }
        public void setWalMaxSize(long walMaxSize) { this.walMaxSize = walMaxSize; }
        public int getRetryIntervalMs() { return retryIntervalMs; }
        public void setRetryIntervalMs(int retryIntervalMs) { this.retryIntervalMs = retryIntervalMs; }
        public int getMaxRetryAttempts() { return maxRetryAttempts; }
        public void setMaxRetryAttempts(int maxRetryAttempts) { this.maxRetryAttempts = maxRetryAttempts; }
        public int getRecoveryBatchSize() { return recoveryBatchSize; }
        public void setRecoveryBatchSize(int recoveryBatchSize) { this.recoveryBatchSize = recoveryBatchSize; }
    }

    public static class HealthCheckConfig {
        private int intervalMs = 5000;
        private int timeoutMs = 3000;
        private int failureThreshold = 3;
        private int successThreshold = 2;

        public int getIntervalMs() { return intervalMs; }
        public void setIntervalMs(int intervalMs) { this.intervalMs = intervalMs; }
        public int getTimeoutMs() { return timeoutMs; }
        public void setTimeoutMs(int timeoutMs) { this.timeoutMs = timeoutMs; }
        public int getFailureThreshold() { return failureThreshold; }
        public void setFailureThreshold(int failureThreshold) { this.failureThreshold = failureThreshold; }
        public int getSuccessThreshold() { return successThreshold; }
        public void setSuccessThreshold(int successThreshold) { this.successThreshold = successThreshold; }
    }

    public static class HotReloadConfig {
        private boolean enabled = true;
        private int intervalMs = 30000;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public int getIntervalMs() { return intervalMs; }
        public void setIntervalMs(int intervalMs) { this.intervalMs = intervalMs; }
    }
}
