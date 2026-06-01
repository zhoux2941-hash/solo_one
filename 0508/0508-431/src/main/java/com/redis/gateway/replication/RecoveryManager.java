package com.redis.gateway.replication;

import com.redis.gateway.cluster.ClusterManager;
import com.redis.gateway.cluster.RedisClusterClient;
import com.redis.gateway.config.ConfigManager;
import com.redis.gateway.config.GatewayConfig;
import com.redis.gateway.protocol.RedisCommand;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class RecoveryManager {
    private static final Logger logger = LoggerFactory.getLogger(RecoveryManager.class);
    private static final int OFFSET_FLUSH_INTERVAL = 50;

    private final ClusterManager clusterManager;
    private final WriteAheadLog wal;
    private final ConfigManager configManager;
    private final ScheduledExecutorService recoveryScheduler;
    private final Map<String, Boolean> recoveringClusters;

    public RecoveryManager(ClusterManager clusterManager, WriteAheadLog wal, ConfigManager configManager) {
        this.clusterManager = clusterManager;
        this.wal = wal;
        this.configManager = configManager;
        this.recoveringClusters = new ConcurrentHashMap<>();
        this.recoveryScheduler = Executors.newScheduledThreadPool(2, r -> {
            Thread t = new Thread(r, "recovery");
            t.setDaemon(true);
            return t;
        });
    }

    public void start() {
        int intervalMs = configManager.getConfig().getReplication().getRetryIntervalMs();
        recoveryScheduler.scheduleAtFixedRate(this::checkAndRecover, 5000, intervalMs, TimeUnit.MILLISECONDS);
        logger.info("Recovery manager started");
    }

    private void checkAndRecover() {
        for (RedisClusterClient client : clusterManager.getAllClusters()) {
            String clusterId = client.getClusterId();
            if (client.isHealthy() && !recoveringClusters.containsKey(clusterId)) {
                List<WriteAheadLog.WalEntry> pendingEntries = wal.getEntriesSince(clusterId, 1);
                if (!pendingEntries.isEmpty()) {
                    startRecovery(client);
                }
            }
        }
    }

    public void onClusterRecovered(String clusterId) {
        RedisClusterClient client = clusterManager.getCluster(clusterId);
        if (client != null && client.isHealthy()) {
            startRecovery(client);
        }
    }

    private void startRecovery(RedisClusterClient client) {
        String clusterId = client.getClusterId();
        if (recoveringClusters.putIfAbsent(clusterId, true) != null) {
            return;
        }
        recoveryScheduler.submit(() -> performRecovery(client));
    }

    private void performRecovery(RedisClusterClient client) {
        String clusterId = client.getClusterId();
        try {
            logger.info("Starting recovery for cluster: {}", clusterId);
            int batchSize = configManager.getConfig().getReplication().getRecoveryBatchSize();
            int maxRetryAttempts = configManager.getConfig().getReplication().getMaxRetryAttempts();

            while (true) {
                if (!client.isHealthy()) {
                    logger.warn("Cluster {} became unhealthy during recovery, stopping", clusterId);
                    break;
                }

                List<WriteAheadLog.WalEntry> entries = wal.getEntriesSince(clusterId, batchSize);
                if (entries.isEmpty()) {
                    logger.info("Recovery completed for cluster: {}", clusterId);
                    break;
                }

                int batchSuccessCount = 0;
                boolean hasFailure = false;
                String lastEntryId = null;

                for (WriteAheadLog.WalEntry entry : entries) {
                    lastEntryId = entry.getUniqueId();
                    if (!shouldReplicateToCluster(entry, clusterId)) {
                        wal.updateClusterOffset(clusterId, entry.getInstanceId(), entry.getSequence());
                        batchSuccessCount++;
                        continue;
                    }

                    int attempts = 0;
                    boolean success = false;
                    while (attempts < maxRetryAttempts && !success) {
                        try {
                            RedisCommand command = entry.toRedisCommand();
                            String[] args = command.getArgStrings().toArray(new String[0]);
                            client.execute(command.getName(), args);
                            success = true;
                            batchSuccessCount++;
                            wal.updateClusterOffset(clusterId, entry.getInstanceId(), entry.getSequence());
                        } catch (Exception e) {
                            attempts++;
                            if (attempts >= maxRetryAttempts) {
                                logger.error("Failed to recover entry {} for cluster {} after {} attempts, stopping recovery",
                                        entry.getUniqueId(), clusterId, attempts, e);
                                hasFailure = true;
                            } else {
                                Thread.sleep(100);
                            }
                        }
                    }

                    if (hasFailure) {
                        break;
                    }
                }

                if (hasFailure) {
                    try {
                        wal.flushIndex();
                    } catch (Exception e) {
                        logger.error("Failed to flush WAL index for cluster {}", clusterId, e);
                    }
                    logger.warn("Recovery stopped for cluster {} due to failure at entry {}", clusterId, lastEntryId);
                    break;
                }

                try {
                    wal.flushIndex();
                } catch (Exception e) {
                    logger.error("Failed to flush WAL index for cluster {}", clusterId, e);
                }

                if (entries.size() < batchSize) {
                    logger.info("Recovery completed for cluster: {}, last entry: {}", clusterId, lastEntryId);
                    break;
                }
            }
        } catch (Exception e) {
            logger.error("Recovery failed for cluster: {}", clusterId, e);
        } finally {
            recoveringClusters.remove(clusterId);
        }
    }

    private boolean shouldReplicateToCluster(WriteAheadLog.WalEntry entry, String clusterId) {
        GatewayConfig.BusinessGroupConfig businessGroup = configManager.getBusinessGroup(entry.getKey());
        if (businessGroup == null) {
            return true;
        }
        return businessGroup.getClusters().contains(clusterId);
    }

    public long getReplicationLag(String clusterId) {
        List<WriteAheadLog.WalEntry> pendingEntries = wal.getEntriesSince(clusterId, Integer.MAX_VALUE);
        return pendingEntries.size();
    }

    public Map<String, Long> getAllReplicationLags() {
        Map<String, Long> lags = new ConcurrentHashMap<>();
        for (RedisClusterClient client : clusterManager.getAllClusters()) {
            lags.put(client.getClusterId(), getReplicationLag(client.getClusterId()));
        }
        return lags;
    }

    public boolean isRecovering(String clusterId) {
        return recoveringClusters.containsKey(clusterId);
    }

    public Set<String> getRecoveringClusters() {
        return recoveringClusters.keySet();
    }

    public void shutdown() {
        recoveryScheduler.shutdownNow();
        logger.info("Recovery manager shutdown complete");
    }
}
