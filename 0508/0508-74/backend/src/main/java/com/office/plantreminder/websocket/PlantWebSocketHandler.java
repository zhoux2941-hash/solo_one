package com.office.plantreminder.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.office.plantreminder.entity.Plant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
public class PlantWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(PlantWebSocketHandler.class);

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final ExecutorService executorService;

    public PlantWebSocketHandler() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.executorService = Executors.newFixedThreadPool(4);
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String sessionId = session.getId();
        sessions.put(sessionId, session);
        logger.info("WebSocket连接建立: {}", sessionId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = session.getId();
        sessions.remove(sessionId);
        logger.info("WebSocket连接关闭: {}, 状态: {}", sessionId, status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        logger.error("WebSocket传输错误: {}", session.getId(), exception);
        if (session.isOpen()) {
            session.close();
        }
        sessions.remove(session.getId());
    }

    public void broadcastPlantUpdate(Plant plant) {
        try {
            String json = objectMapper.writeValueAsString(plant);
            logger.debug("广播绿植更新: plantId={}, sessions={}", plant.getId(), sessions.size());

            for (Map.Entry<String, WebSocketSession> entry : sessions.entrySet()) {
                String sessionId = entry.getKey();
                WebSocketSession session = entry.getValue();

                executorService.submit(() -> {
                    try {
                        if (session.isOpen()) {
                            synchronized (session) {
                                session.sendMessage(new TextMessage(json));
                            }
                            logger.debug("消息已发送到会话: {}", sessionId);
                        } else {
                            sessions.remove(sessionId);
                            logger.warn("会话已关闭，移除: {}", sessionId);
                        }
                    } catch (IOException e) {
                        logger.error("发送消息失败: sessionId={}", sessionId, e);
                        sessions.remove(sessionId);
                        try {
                            if (session.isOpen()) {
                                session.close();
                            }
                        } catch (IOException ex) {
                            // ignore
                        }
                    }
                });
            }
        } catch (Exception e) {
            logger.error("广播消息序列化失败", e);
        }
    }

    public int getSessionCount() {
        return sessions.size();
    }
}
