package com.redis.gateway.cluster;

import com.redis.gateway.config.GatewayConfig;
import org.apache.commons.pool2.impl.GenericObjectPool;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.exceptions.JedisException;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class RedisClusterClient {
    private static final Logger logger = LoggerFactory.getLogger(RedisClusterClient.class);

    private final String clusterId;
    private final GatewayConfig.ClusterConfig config;
    private final JedisPool jedisPool;
    private final AtomicBoolean healthy = new AtomicBoolean(true);
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicLong lastSuccessTime = new AtomicLong(0);
    private final AtomicLong lastFailureTime = new AtomicLong(0);
    private final AtomicLong totalCommands = new AtomicLong(0);
    private final AtomicLong failedCommands = new AtomicLong(0);

    public RedisClusterClient(GatewayConfig.ClusterConfig config) {
        this.clusterId = config.getId();
        this.config = config;
        this.jedisPool = createJedisPool(config);
    }

    private JedisPool createJedisPool(GatewayConfig.ClusterConfig config) {
        GenericObjectPoolConfig<Jedis> poolConfig = new GenericObjectPoolConfig<>();
        poolConfig.setMaxTotal(config.getMaxPoolSize());
        poolConfig.setMinIdle(config.getMinIdle());
        poolConfig.setMaxIdle(config.getMaxPoolSize());
        poolConfig.setTestOnBorrow(true);
        poolConfig.setTestOnReturn(true);
        poolConfig.setTestWhileIdle(true);

        String node = config.getNodes().get(0);
        String[] parts = node.split(":");
        String host = parts[0];
        int port = parts.length > 1 ? Integer.parseInt(parts[1]) : 6379;

        return new JedisPool(poolConfig, host, port, config.getTimeoutMs(),
                config.getPassword() != null && !config.getPassword().isEmpty() ? config.getPassword() : null,
                config.getDatabase());
    }

    public Jedis getResource() {
        return jedisPool.getResource();
    }

    public void returnResource(Jedis jedis) {
        if (jedis != null) {
            jedis.close();
        }
    }

    public String execute(String command, String... args) {
        totalCommands.incrementAndGet();
        try (Jedis jedis = getResource()) {
            String result = executeCommand(jedis, command, args);
            markSuccess();
            return result;
        } catch (Exception e) {
            failedCommands.incrementAndGet();
            markFailure();
            logger.error("Command execution failed on cluster {}: {} {}", clusterId, command, e.getMessage());
            throw e;
        }
    }

    public byte[] executeBinary(String command, byte[]... args) {
        totalCommands.incrementAndGet();
        try (Jedis jedis = getResource()) {
            byte[] result = executeBinaryCommand(jedis, command, args);
            markSuccess();
            return result;
        } catch (Exception e) {
            failedCommands.incrementAndGet();
            markFailure();
            logger.error("Binary command execution failed on cluster {}: {}", clusterId, e.getMessage());
            throw e;
        }
    }

    private String executeCommand(Jedis jedis, String command, String... args) {
        switch (command.toUpperCase()) {
            case "GET":
                return jedis.get(args[0]);
            case "SET":
                if (args.length == 2) {
                    return jedis.set(args[0], args[1]);
                } else if (args.length == 4 && args[2].equalsIgnoreCase("EX")) {
                    return jedis.setex(args[0], Integer.parseInt(args[3]), args[1]);
                } else if (args.length == 4 && args[2].equalsIgnoreCase("PX")) {
                    return jedis.psetex(args[0], Long.parseLong(args[3]), args[1]);
                }
                return jedis.set(args[0], args[1]);
            case "SETNX":
                return jedis.setnx(args[0], args[1]) == 1 ? "OK" : null;
            case "SETEX":
                return jedis.setex(args[0], Integer.parseInt(args[1]), args[2]);
            case "DEL":
                return String.valueOf(jedis.del(args));
            case "EXISTS":
                return String.valueOf(jedis.exists(args));
            case "EXPIRE":
                return String.valueOf(jedis.expire(args[0], Integer.parseInt(args[1])));
            case "TTL":
                return String.valueOf(jedis.ttl(args[0]));
            case "INCR":
                return String.valueOf(jedis.incr(args[0]));
            case "INCRBY":
                return String.valueOf(jedis.incrBy(args[0], Long.parseLong(args[1])));
            case "DECR":
                return String.valueOf(jedis.decr(args[0]));
            case "DECRBY":
                return String.valueOf(jedis.decrBy(args[0], Long.parseLong(args[1])));
            case "APPEND":
                return String.valueOf(jedis.append(args[0], args[1]));
            case "STRLEN":
                return String.valueOf(jedis.strlen(args[0]));
            case "PING":
                return jedis.ping();
            default:
                throw new JedisException("Unsupported command: " + command);
        }
    }

    private byte[] executeBinaryCommand(Jedis jedis, String command, byte[]... args) {
        switch (command.toUpperCase()) {
            case "GET":
                return jedis.get(args[0]);
            case "SET":
                if (args.length == 2) {
                    return jedis.set(args[0], args[1]) != null ? "OK".getBytes() : null;
                }
                return jedis.set(args[0], args[1]) != null ? "OK".getBytes() : null;
            case "DEL":
                return String.valueOf(jedis.del(args)).getBytes();
            default:
                throw new JedisException("Unsupported binary command: " + command);
        }
    }

    public boolean ping() {
        try (Jedis jedis = getResource()) {
            String pong = jedis.ping();
            boolean success = "PONG".equals(pong);
            if (success) {
                markSuccess();
            } else {
                markFailure();
            }
            return success;
        } catch (Exception e) {
            markFailure();
            return false;
        }
    }

    public boolean isHealthy() {
        return healthy.get();
    }

    public void setHealthy(boolean healthy) {
        this.healthy.set(healthy);
    }

    private void markSuccess() {
        lastSuccessTime.set(System.currentTimeMillis());
        successCount.incrementAndGet();
        failureCount.set(0);
    }

    private void markFailure() {
        lastFailureTime.set(System.currentTimeMillis());
        failureCount.incrementAndGet();
        successCount.set(0);
    }

    public int getFailureCount() {
        return failureCount.get();
    }

    public int getSuccessCount() {
        return successCount.get();
    }

    public long getLastSuccessTime() {
        return lastSuccessTime.get();
    }

    public long getLastFailureTime() {
        return lastFailureTime.get();
    }

    public String getClusterId() {
        return clusterId;
    }

    public GatewayConfig.ClusterConfig getConfig() {
        return config;
    }

    public String getRegion() {
        return config.getRegion();
    }

    public long getTotalCommands() {
        return totalCommands.get();
    }

    public long getFailedCommands() {
        return failedCommands.get();
    }

    public void close() {
        try {
            jedisPool.close();
            logger.info("Redis cluster client {} closed", clusterId);
        } catch (Exception e) {
            logger.error("Error closing Redis cluster client {}", clusterId, e);
        }
    }
}
