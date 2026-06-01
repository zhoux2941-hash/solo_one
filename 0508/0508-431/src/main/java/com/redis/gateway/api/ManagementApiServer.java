package com.redis.gateway.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.redis.gateway.cluster.ClusterManager;
import com.redis.gateway.cluster.RedisClusterClient;
import com.redis.gateway.config.ConfigManager;
import com.redis.gateway.core.CommandProcessor;
import com.redis.gateway.replication.RecoveryManager;
import com.redis.gateway.replication.WriteAheadLog;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.Instant;
import java.util.*;

public class ManagementApiServer {
    private static final Logger logger = LoggerFactory.getLogger(ManagementApiServer.class);

    private final ConfigManager configManager;
    private final ClusterManager clusterManager;
    private final CommandProcessor commandProcessor;
    private final RecoveryManager recoveryManager;
    private final WriteAheadLog wal;
    private final ObjectMapper objectMapper;

    private Server server;
    private volatile boolean running = false;

    public ManagementApiServer(ConfigManager configManager, ClusterManager clusterManager,
                               CommandProcessor commandProcessor, RecoveryManager recoveryManager,
                               WriteAheadLog wal) {
        this.configManager = configManager;
        this.clusterManager = clusterManager;
        this.commandProcessor = commandProcessor;
        this.recoveryManager = recoveryManager;
        this.wal = wal;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    public void start() throws Exception {
        int port = configManager.getConfig().getGateway().getManagementPort();
        server = new Server();
        ServerConnector connector = new ServerConnector(server);
        connector.setPort(port);
        server.addConnector(connector);

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");

        context.addServlet(new ServletHolder(new HealthServlet()), "/health");
        context.addServlet(new ServletHolder(new ClusterStatusServlet()), "/api/clusters");
        context.addServlet(new ServletHolder(new StatsServlet()), "/api/stats");
        context.addServlet(new ServletHolder(new KeyInfoServlet()), "/api/key/*");
        context.addServlet(new ServletHolder(new ReplicationLagServlet()), "/api/replication/lag");
        context.addServlet(new ServletHolder(new BusinessGroupsServlet()), "/api/business-groups");
        context.addServlet(new ServletHolder(new RecoveryStatusServlet()), "/api/recovery/status");
        context.addServlet(new ServletHolder(new ConfigReloadServlet()), "/api/config/reload");

        server.setHandler(context);
        server.start();
        running = true;
        logger.info("Management API Server started on port {}", port);
    }

    public void stop() throws Exception {
        if (!running) {
            return;
        }
        running = false;
        logger.info("Stopping Management API Server...");
        if (server != null) {
            server.stop();
        }
        logger.info("Management API Server stopped");
    }

    private void writeJsonResponse(HttpServletResponse response, Object data) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        try (PrintWriter writer = response.getWriter()) {
            objectMapper.writeValue(writer, data);
        }
    }

    private void writeErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("error", message);
        error.put("status", status);
        try (PrintWriter writer = response.getWriter()) {
            objectMapper.writeValue(writer, error);
        }
    }

    class HealthServlet extends HttpServlet {
        @Override
        protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
            Map<String, Object> health = new LinkedHashMap<>();
            health.put("status", "healthy");
            health.put("timestamp", Instant.now().toString());
            health.put("healthyClusters", clusterManager.getHealthyClusters().size());
            health.put("totalClusters", clusterManager.getAllClusters().size());
            writeJsonResponse(resp, health);
        }
    }

    class ClusterStatusServlet extends HttpServlet {
        @Override
        protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
            List<Map<String, Object>> clusters = new ArrayList<>();
            for (RedisClusterClient client : clusterManager.getAllClusters()) {
                Map<String, Object> cluster = new LinkedHashMap<>();
                cluster.put("id", client.getClusterId());
                cluster.put("name", client.getConfig().getName());
                cluster.put("region", client.getRegion());
                cluster.put("healthy", client.isHealthy());
                cluster.put("totalCommands", client.getTotalCommands());
                cluster.put("failedCommands", client.getFailedCommands());
                cluster.put("lastSuccessTime", client.getLastSuccessTime() > 0 ?
                        Instant.ofEpochMilli(client.getLastSuccessTime()).toString() : null);
                cluster.put("lastFailureTime", client.getLastFailureTime() > 0 ?
                        Instant.ofEpochMilli(client.getLastFailureTime()).toString() : null);
                cluster.put("failureCount", client.getFailureCount());
                clusters.add(cluster);
            }
            writeJsonResponse(resp, clusters);
        }
    }

    class StatsServlet extends HttpServlet {
        @Override
        protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("timestamp", Instant.now().toString());
            stats.put("commandProcessor", commandProcessor.getStats());
            stats.put("wal", wal != null ? Map.of(
                    "instanceId", wal.getInstanceId(),
                    "currentSequence", wal.getCurrentSequence(),
                    "enabled", configManager.getConfig().getReplication().isWalEnabled()
            ) : null);
            writeJsonResponse(resp, stats);
        }
    }

    class KeyInfoServlet extends HttpServlet {
        @Override
        protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
            String path = req.getPathInfo();
            if (path == null || path.length() <= 1) {
                writeErrorResponse(resp, 400, "Key is required");
                return;
            }
            String key = path.substring(1);
            Map<String, Object> keyInfo = new LinkedHashMap<>();
            keyInfo.put("key", key);
            Long lastWriteTime = commandProcessor.getKeyLastWriteTime(key);
            keyInfo.put("lastWriteTime", lastWriteTime != null ?
                    Instant.ofEpochMilli(lastWriteTime).toString() : null);
            keyInfo.put("writeSource", commandProcessor.getKeyWriteSource(key));
            keyInfo.put("businessGroup", configManager.getBusinessGroup(key).getName());
            writeJsonResponse(resp, keyInfo);
        }
    }

    class ReplicationLagServlet extends HttpServlet {
        @Override
        protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
            Map<String, Object> lagInfo = new LinkedHashMap<>();
            lagInfo.put("timestamp", Instant.now().toString());
            if (wal != null) {
                lagInfo.put("instanceId", wal.getInstanceId());
                lagInfo.put("currentSequence", wal.getCurrentSequence());
                Map<String, Object> clusterLags = new LinkedHashMap<>();
                for (Map.Entry<String, Long> entry : recoveryManager.getAllReplicationLags().entrySet()) {
                    Map<String, Object> clusterInfo = new LinkedHashMap<>();
                    clusterInfo.put("pendingEntries", entry.getValue());
                    clusterLags.put(entry.getKey(), clusterInfo);
                }
                lagInfo.put("clusters", clusterLags);
            }
            writeJsonResponse(resp, lagInfo);
        }
    }

    class BusinessGroupsServlet extends HttpServlet {
        @Override
        protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
            List<Map<String, Object>> groups = new ArrayList<>();
            for (var group : configManager.getConfig().getBusinessGroups()) {
                Map<String, Object> groupInfo = new LinkedHashMap<>();
                groupInfo.put("name", group.getName());
                groupInfo.put("prefixes", group.getPrefixes());
                groupInfo.put("clusters", group.getClusters());
                groupInfo.put("readPreference", group.getReadPreference());
                groupInfo.put("writeConsistency", group.getWriteConsistency());
                groups.add(groupInfo);
            }
            writeJsonResponse(resp, groups);
        }
    }

    class RecoveryStatusServlet extends HttpServlet {
        @Override
        protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
            Map<String, Object> recoveryInfo = new LinkedHashMap<>();
            recoveryInfo.put("timestamp", Instant.now().toString());
            recoveryInfo.put("recoveringClusters", recoveryManager.getRecoveringClusters());
            Map<String, Boolean> clusterRecoveryStatus = new LinkedHashMap<>();
            for (RedisClusterClient client : clusterManager.getAllClusters()) {
                clusterRecoveryStatus.put(client.getClusterId(),
                        recoveryManager.isRecovering(client.getClusterId()));
            }
            recoveryInfo.put("clusterRecoveryStatus", clusterRecoveryStatus);
            writeJsonResponse(resp, recoveryInfo);
        }
    }

    class ConfigReloadServlet extends HttpServlet {
        @Override
        protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
            try {
                configManager.startHotReload();
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("status", "success");
                result.put("message", "Configuration reload triggered");
                writeJsonResponse(resp, result);
            } catch (Exception e) {
                writeErrorResponse(resp, 500, "Failed to reload config: " + e.getMessage());
            }
        }
    }

    public boolean isRunning() {
        return running;
    }
}
