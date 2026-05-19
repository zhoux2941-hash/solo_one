package com.antifraud.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

@WebSocket
public class AlertWebSocketHandler {
    private static final Logger LOG = LoggerFactory.getLogger(AlertWebSocketHandler.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Queue<Session> sessions = new ConcurrentLinkedQueue<>();

    @OnWebSocketConnect
    public void connected(Session session) {
        sessions.add(session);
        LOG.info("WebSocket client connected: {}", session.getRemoteAddress());
    }

    @OnWebSocketClose
    public void closed(Session session, int statusCode, String reason) {
        sessions.remove(session);
        LOG.info("WebSocket client disconnected: {}", session.getRemoteAddress());
    }

    @OnWebSocketMessage
    public void message(Session session, String message) throws IOException {
        LOG.debug("Received WebSocket message: {}", message);
    }

    public static void broadcastAlert(Map<String, Object> alert) {
        try {
            String json = objectMapper.writeValueAsString(alert);
            sessions.removeIf(session -> {
                if (!session.isOpen()) {
                    return true;
                }
                try {
                    session.getRemote().sendString(json);
                    return false;
                } catch (Exception e) {
                    LOG.error("Failed to send WebSocket message", e);
                    return true;
                }
            });
        } catch (Exception e) {
            LOG.error("Failed to serialize alert", e);
        }
    }
}
