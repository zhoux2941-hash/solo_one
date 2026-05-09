package com.gym.sanitization.service;

import com.gym.sanitization.dto.SanitizationAlertDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class WebSocketService {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketService.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendAlerts(List<SanitizationAlertDTO> alerts) {
        if (alerts == null || alerts.isEmpty()) {
            return;
        }

        logger.info("Sending {} sanitization alerts via WebSocket", alerts.size());

        messagingTemplate.convertAndSend("/topic/alerts", Map.of(
            "type", "sanitization-alert",
            "alerts", alerts,
            "timestamp", System.currentTimeMillis()
        ));
    }

    public void sendAlert(SanitizationAlertDTO alert) {
        logger.info("Sending single sanitization alert for equipment: {}", alert.getEquipmentName());

        messagingTemplate.convertAndSend("/topic/alerts", Map.of(
            "type", "sanitization-alert",
            "alerts", List.of(alert),
            "timestamp", System.currentTimeMillis()
        ));
    }

    public void sendStatusUpdate(String type, Object data) {
        messagingTemplate.convertAndSend("/topic/status", Map.of(
            "type", type,
            "data", data,
            "timestamp", System.currentTimeMillis()
        ));
    }
}
