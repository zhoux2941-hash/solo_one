package com.redis.gateway.core;

import com.redis.gateway.cluster.ClusterManager;
import com.redis.gateway.cluster.RedisClusterClient;
import com.redis.gateway.config.ConfigManager;
import com.redis.gateway.config.GatewayConfig;
import com.redis.gateway.protocol.RedisCommand;
import com.redis.gateway.protocol.RedisResponse;
import com.redis.gateway.replication.RecoveryManager;
import com.redis.gateway.replication.WriteAheadLog;
import com.redis.gateway.replication.WriteAheadLog.WalEntry;
import io.micrometer.core.instrument.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

public class CommandProcessor {
    private static final Logger logger = LoggerFactory.getLogger(CommandProcessor.class);

    private final ClusterManager clusterManager;
    private final ConfigManager configManager;
    private final WriteAheadLog wal;
    private final RecoveryManager recoveryManager;
    private final MeterRegistry meterRegistry;

    private final ExecutorService writeExecutor;
    private final ExecutorService readExecutor;
    private final Random random = new Random();

    private final AtomicLong totalReadCommands = new AtomicLong(0);
    private final AtomicLong totalWriteCommands = new AtomicLong(0);
    private final AtomicLong failedCommands = new AtomicLong(0);
    private final Map<String, AtomicLong> keyWriteTimes = new ConcurrentHashMap<>();
    private final Map<String, String> keyWriteSources = new ConcurrentHashMap<>();

    public CommandProcessor(ClusterManager clusterManager, ConfigManager configManager,
                            WriteAheadLog wal, RecoveryManager recoveryManager) {
        this.clusterManager = clusterManager;
        this.configManager = configManager;
        this.wal = wal;
        this.recoveryManager = recoveryManager;
        this.meterRegistry = Metrics.globalRegistry;
        this.writeExecutor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() * 2, r -> {
            Thread t = new Thread(r, "write-processor");
            t.setDaemon(true);
            return t;
        });
        this.readExecutor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() * 4, r -> {
            Thread t = new Thread(r, "read-processor");
            t.setDaemon(true);
            return t;
        });
    }

    public RedisResponse processCommand(RedisCommand command) {
        io.micrometer.core.instrument.Timer.Sample sample = io.micrometer.core.instrument.Timer.start(meterRegistry);
        try {
            if (command.isWriteCommand()) {
                return processWriteCommand(command);
            } else {
                return processReadCommand(command);
            }
        } finally {
            sample.stop(io.micrometer.core.instrument.Timer.builder("redis.gateway.command.processing")
                    .tag("command", command.getName())
                    .tag("type", command.isWriteCommand() ? "write" : "read")
                    .register(meterRegistry));
        }
    }

    private RedisResponse processWriteCommand(RedisCommand command) {
        totalWriteCommands.incrementAndGet();
        String key = command.getKey();
        String businessGroup = getBusinessGroupName(key);

        List<RedisClusterClient> healthyClusters = clusterManager.getHealthyClustersForBusinessKey(key);
        if (healthyClusters.isEmpty()) {
            failedCommands.incrementAndGet();
            return RedisResponse.error("No healthy clusters available");
        }

        GatewayConfig.BusinessGroupConfig bgConfig = configManager.getBusinessGroup(key);
        GatewayConfig.WriteConsistency consistency = bgConfig != null ?
                bgConfig.getWriteConsistency() : GatewayConfig.WriteConsistency.ALL;

        int requiredSuccess = calculateRequiredSuccess(healthyClusters.size(), consistency);
        if (requiredSuccess == 0) {
            requiredSuccess = 1;
        }

        WalEntry walEntry = null;
        if (wal != null && configManager.getConfig().getReplication().isWalEnabled()) {
            try {
                walEntry = wal.append(command, key, businessGroup);
            } catch (IOException e) {
                logger.error("Failed to write to WAL", e);
            }
        }

        List<CompletableFuture<String>> futures = new ArrayList<>();
        for (RedisClusterClient client : healthyClusters) {
            futures.add(CompletableFuture.supplyAsync(() -> {
                try {
                    String[] args = command.getArgStrings().toArray(new String[0]);
                    return client.execute(command.getName(), args);
                } catch (Exception e) {
                    logger.error("Write failed on cluster {}: {}", client.getClusterId(), e.getMessage());
                    return null;
                }
            }, writeExecutor));
        }

        int successCount = 0;
        String firstResult = null;
        List<Exception> exceptions = new ArrayList<>();
        final WalEntry finalWalEntry = walEntry;

        for (int i = 0; i < futures.size(); i++) {
            try {
                String result = futures.get(i).get(5, TimeUnit.SECONDS);
                if (result != null) {
                    successCount++;
                    if (firstResult == null) {
                        firstResult = result;
                    }
                    if (wal != null && finalWalEntry != null) {
                        wal.updateClusterOffset(healthyClusters.get(i).getClusterId(),
                                finalWalEntry.getInstanceId(), finalWalEntry.getSequence());
                    }
                }
            } catch (Exception e) {
                exceptions.add(e);
            }
        }

        updateKeyMetadata(key);

        if (successCount >= requiredSuccess) {
            return parseRedisResponse(firstResult, command.getName());
        } else {
            failedCommands.incrementAndGet();
            return RedisResponse.error(String.format("Write failed: only %d/%d clusters succeeded (required %d)",
                    successCount, healthyClusters.size(), requiredSuccess));
        }
    }

    private int calculateRequiredSuccess(int totalClusters, GatewayConfig.WriteConsistency consistency) {
        switch (consistency) {
            case ALL:
                return totalClusters;
            case MAJORITY:
                return totalClusters / 2 + 1;
            default:
                return totalClusters;
        }
    }

    private RedisResponse processReadCommand(RedisCommand command) {
        totalReadCommands.incrementAndGet();
        String key = command.getKey();

        GatewayConfig.BusinessGroupConfig bgConfig = configManager.getBusinessGroup(key);
        GatewayConfig.ReadPreference readPreference = bgConfig != null ?
                bgConfig.getReadPreference() : GatewayConfig.ReadPreference.LOCAL_FIRST;

        List<RedisClusterClient> healthyClusters = clusterManager.getHealthyClustersForBusinessKey(key);
        if (healthyClusters.isEmpty()) {
            failedCommands.incrementAndGet();
            return RedisResponse.error("No healthy clusters available");
        }

        try {
            switch (readPreference) {
                case LOCAL_FIRST:
                    return readWithLocalFirst(command, healthyClusters);
                case RANDOM:
                    return readWithRandom(command, healthyClusters);
                case CONSISTENCY_CHECK:
                    return readWithConsistencyCheck(command, healthyClusters);
                default:
                    return readWithLocalFirst(command, healthyClusters);
            }
        } catch (Exception e) {
            failedCommands.incrementAndGet();
            logger.error("Read command failed", e);
            return RedisResponse.error("Read failed: " + e.getMessage());
        }
    }

    private RedisResponse readWithLocalFirst(RedisCommand command, List<RedisClusterClient> clusters) {
        RedisClusterClient localCluster = clusterManager.getLocalCluster();
        if (localCluster != null && localCluster.isHealthy() && isClusterInBusinessGroup(command.getKey(), localCluster)) {
            try {
                String result = executeRead(localCluster, command);
                return parseRedisResponse(result, command.getName());
            } catch (Exception e) {
                logger.warn("Local read failed, falling back to other clusters", e);
            }
        }
        for (RedisClusterClient client : clusters) {
            if (client != localCluster) {
                try {
                    String result = executeRead(client, command);
                    return parseRedisResponse(result, command.getName());
                } catch (Exception e) {
                    continue;
                }
            }
        }
        return RedisResponse.error("All reads failed");
    }

    private RedisResponse readWithRandom(RedisCommand command, List<RedisClusterClient> clusters) {
        if (clusters.isEmpty()) {
            return RedisResponse.error("No clusters available");
        }
        Collections.shuffle(clusters);
        for (RedisClusterClient client : clusters) {
            try {
                String result = executeRead(client, command);
                return parseRedisResponse(result, command.getName());
            } catch (Exception e) {
                continue;
            }
        }
        return RedisResponse.error("All reads failed");
    }

    private RedisResponse readWithConsistencyCheck(RedisCommand command, List<RedisClusterClient> clusters) throws Exception {
        List<CompletableFuture<String>> futures = new ArrayList<>();
        for (RedisClusterClient client : clusters) {
            futures.add(CompletableFuture.supplyAsync(() -> executeRead(client, command), readExecutor));
        }

        Set<String> results = new HashSet<>();
        String firstResult = null;
        for (CompletableFuture<String> future : futures) {
            try {
                String result = future.get(3, TimeUnit.SECONDS);
                if (result != null) {
                    results.add(result);
                    if (firstResult == null) {
                        firstResult = result;
                    }
                }
            } catch (Exception e) {
            }
        }

        if (results.size() > 1) {
            logger.warn("Inconsistent read results for key {}: {} different values", command.getKey(), results.size());
        }

        return parseRedisResponse(firstResult, command.getName());
    }

    private boolean isClusterInBusinessGroup(String key, RedisClusterClient cluster) {
        List<RedisClusterClient> groupClusters = clusterManager.getClustersForBusinessKey(key);
        return groupClusters.stream().anyMatch(c -> c.getClusterId().equals(cluster.getClusterId()));
    }

    private String executeRead(RedisClusterClient client, RedisCommand command) {
        String[] args = command.getArgStrings().toArray(new String[0]);
        return client.execute(command.getName(), args);
    }

    private RedisResponse parseRedisResponse(String result, String commandName) {
        if (result == null) {
            return RedisResponse.nullBulk();
        }
        if ("OK".equals(result)) {
            return RedisResponse.ok();
        }
        try {
            long num = Long.parseLong(result);
            return RedisResponse.integer(num);
        } catch (NumberFormatException e) {
        }
        return RedisResponse.bulkString(result);
    }

    private String getBusinessGroupName(String key) {
        GatewayConfig.BusinessGroupConfig bgConfig = configManager.getBusinessGroup(key);
        return bgConfig != null ? bgConfig.getName() : "default";
    }

    private void updateKeyMetadata(String key) {
        keyWriteTimes.put(key, new AtomicLong(System.currentTimeMillis()));
        keyWriteSources.put(key, configManager.getConfig().getGateway().getLocalRegion());
    }

    public Long getKeyLastWriteTime(String key) {
        AtomicLong time = keyWriteTimes.get(key);
        return time != null ? time.get() : null;
    }

    public String getKeyWriteSource(String key) {
        return keyWriteSources.get(key);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalReadCommands", totalReadCommands.get());
        stats.put("totalWriteCommands", totalWriteCommands.get());
        stats.put("failedCommands", failedCommands.get());
        stats.put("trackedKeys", keyWriteTimes.size());
        return stats;
    }

    public void shutdown() {
        writeExecutor.shutdownNow();
        readExecutor.shutdownNow();
    }
}
