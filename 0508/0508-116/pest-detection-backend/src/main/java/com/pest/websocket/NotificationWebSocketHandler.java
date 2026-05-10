package com.pest.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final ConcurrentHashMap<Long, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public NotificationWebSocketHandler() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = extractUserId(session);
        if (userId != null) {
            sessions.put(userId, session);
            log.info("WebSocket连接建立，用户ID: {}", userId);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = extractUserId(session);
        if (userId != null) {
            sessions.remove(userId);
            log.info("WebSocket连接关闭，用户ID: {}", userId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        log.debug("收到消息: {}", message.getPayload());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket传输错误", exception);
    }

    public void sendNotification(Long userId, Map<String, Object> notification) {
        WebSocketSession session = sessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String json = objectMapper.writeValueAsString(notification);
                session.sendMessage(new TextMessage(json));
                log.info("已向用户 {} 发送通知: {}", userId, notification.get("type"));
            } catch (IOException e) {
                log.error("发送WebSocket消息失败", e);
                sessions.remove(userId);
            }
        } else {
            log.warn("用户 {} 不在线，通知未发送", userId);
        }
    }

    private Long extractUserId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri != null) {
            String query = uri.getQuery();
            if (query != null) {
                for (String param : query.split("&")) {
                    String[] parts = param.split("=");
                    if (parts.length == 2 && "userId".equals(parts[0])) {
                        try {
                            return Long.parseLong(parts[1]);
                        } catch (NumberFormatException e) {
                            log.warn("无效的用户ID: {}", parts[1]);
                        }
                    }
                }
            }
        }
        return null;
    }
}