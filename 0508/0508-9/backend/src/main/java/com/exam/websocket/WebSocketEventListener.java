package com.exam.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

@Slf4j
@Component
public class WebSocketEventListener {
    
    private final WebSocketConnectionManager connectionManager;
    
    public WebSocketEventListener(WebSocketConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }
    
    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        
        Object examIdObj = accessor.getSessionAttributes() != null ? 
                accessor.getSessionAttributes().get("examId") : null;
        
        log.info("Session disconnected: sessionId={}, examId={}", sessionId, examIdObj);
        
        if (examIdObj != null) {
            Long examId = Long.valueOf(examIdObj.toString());
            connectionManager.decrementConnection(examId, sessionId);
        }
        
        log.debug("Current total connections: {}", connectionManager.getTotalConnections());
    }
    
    @EventListener
    public void handleSessionUnsubscribe(SessionUnsubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        String destination = accessor.getDestination();
        
        log.info("Session unsubscribed: sessionId={}, destination={}", sessionId, destination);
        
        if (destination != null && destination.startsWith("/topic/exam/")) {
            try {
                Long examId = Long.valueOf(destination.substring("/topic/exam/".length()));
                connectionManager.decrementConnection(examId, sessionId);
                log.info("Unsubscribed from exam room: examId={}, sessionId={}", examId, sessionId);
            } catch (NumberFormatException e) {
                log.warn("Failed to parse examId from destination: {}", destination);
            }
        }
    }
    
    @EventListener
    public void handleSessionSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        String destination = accessor.getDestination();
        
        log.debug("Session subscribed: sessionId={}, destination={}", sessionId, destination);
    }
}
