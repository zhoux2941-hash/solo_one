package com.redis.gateway;

import com.redis.gateway.api.ManagementApiServer;
import com.redis.gateway.cluster.ClusterManager;
import com.redis.gateway.config.ConfigManager;
import com.redis.gateway.core.CommandProcessor;
import com.redis.gateway.netty.RedisGatewayServer;
import com.redis.gateway.replication.RecoveryManager;
import com.redis.gateway.replication.WriteAheadLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RedisGatewayBootstrap {
    private static final Logger logger = LoggerFactory.getLogger(RedisGatewayBootstrap.class);

    private ConfigManager configManager;
    private ClusterManager clusterManager;
    private WriteAheadLog writeAheadLog;
    private RecoveryManager recoveryManager;
    private CommandProcessor commandProcessor;
    private RedisGatewayServer gatewayServer;
    private ManagementApiServer apiServer;

    private volatile boolean running = false;

    public static void main(String[] args) {
        RedisGatewayBootstrap bootstrap = new RedisGatewayBootstrap();
        try {
            String configPath = args.length > 0 ? args[0] : "gateway-config.json";
            bootstrap.start(configPath);
            bootstrap.waitForShutdown();
        } catch (Exception e) {
            logger.error("Failed to start Redis Gateway", e);
            System.exit(1);
        }
    }

    public void start(String configPath) throws Exception {
        logger.info("Starting Redis Multi-Live Gateway...");

        configManager = new ConfigManager(configPath);
        logger.info("Configuration loaded");

        clusterManager = new ClusterManager(configManager);
        logger.info("Cluster manager initialized");

        if (configManager.getConfig().getReplication().isWalEnabled()) {
            String instanceId = configManager.getConfig().getGateway().getInstanceId();
            writeAheadLog = new WriteAheadLog(
                    configManager.getConfig().getReplication().getWalPath(),
                    configManager.getConfig().getReplication().getWalMaxSize(),
                    instanceId
            );
            logger.info("Write-Ahead Log initialized with instanceId: {}", writeAheadLog.getInstanceId());
        }

        recoveryManager = new RecoveryManager(clusterManager, writeAheadLog, configManager);

        commandProcessor = new CommandProcessor(clusterManager, configManager, writeAheadLog, recoveryManager);
        logger.info("Command processor initialized");

        gatewayServer = new RedisGatewayServer(configManager, commandProcessor);
        gatewayServer.start();

        apiServer = new ManagementApiServer(configManager, clusterManager, commandProcessor, recoveryManager, writeAheadLog);
        apiServer.start();

        configManager.addListener((oldConfig, newConfig) -> {
            clusterManager.onConfigChange(oldConfig, newConfig);
        });
        configManager.startHotReload();

        clusterManager.startHealthCheck();

        recoveryManager.start();

        running = true;
        logger.info("==================================================");
        logger.info("Redis Multi-Live Gateway started successfully!");
        logger.info("  Redis port: {}", configManager.getConfig().getGateway().getPort());
        logger.info("  Management API port: {}", configManager.getConfig().getGateway().getManagementPort());
        logger.info("  Local region: {}", configManager.getConfig().getGateway().getLocalRegion());
        logger.info("  Clusters: {}", clusterManager.getAllClusters().size());
        logger.info("==================================================");

        Runtime.getRuntime().addShutdownHook(new Thread(this::stop));
    }

    public void waitForShutdown() throws InterruptedException {
        if (gatewayServer != null) {
            gatewayServer.waitForShutdown();
        }
    }

    public void stop() {
        if (!running) {
            return;
        }
        running = false;
        logger.info("Shutting down Redis Multi-Live Gateway...");

        try {
            if (gatewayServer != null) {
                gatewayServer.stop();
            }
        } catch (Exception e) {
            logger.error("Error stopping gateway server", e);
        }

        try {
            if (apiServer != null) {
                apiServer.stop();
            }
        } catch (Exception e) {
            logger.error("Error stopping API server", e);
        }

        try {
            if (recoveryManager != null) {
                recoveryManager.shutdown();
            }
        } catch (Exception e) {
            logger.error("Error stopping recovery manager", e);
        }

        try {
            if (commandProcessor != null) {
                commandProcessor.shutdown();
            }
        } catch (Exception e) {
            logger.error("Error stopping command processor", e);
        }

        try {
            if (writeAheadLog != null) {
                writeAheadLog.close();
            }
        } catch (Exception e) {
            logger.error("Error closing WAL", e);
        }

        try {
            if (clusterManager != null) {
                clusterManager.shutdown();
            }
        } catch (Exception e) {
            logger.error("Error stopping cluster manager", e);
        }

        try {
            if (configManager != null) {
                configManager.shutdown();
            }
        } catch (Exception e) {
            logger.error("Error stopping config manager", e);
        }

        logger.info("Redis Multi-Live Gateway shutdown complete");
    }

    public boolean isRunning() {
        return running;
    }
}
