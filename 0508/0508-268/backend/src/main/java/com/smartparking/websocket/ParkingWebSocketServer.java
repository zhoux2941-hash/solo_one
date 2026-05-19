package com.smartparking.websocket;

import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
@ServerEndpoint("/ws/parking/{clientType}/{clientId}")
public class ParkingWebSocketServer {

    private static final Map<String, Session> SESSION_MAP = new ConcurrentHashMap<>();
    private static final Map<String, String> CLIENT_TYPE_MAP = new ConcurrentHashMap<>();
    private static final Map<String, String> CLIENT_ID_MAP = new ConcurrentHashMap<>();
    private static final Map<String, Long> LAST_HEARTBEAT_MAP = new ConcurrentHashMap<>();
    private static final Map<String, Queue<String>> MESSAGE_QUEUE_MAP = new ConcurrentHashMap<>();
    private static final Map<String, Long> LAST_PONG_MAP = new ConcurrentHashMap<>();
    private static final AtomicInteger ONLINE_COUNT = new AtomicInteger(0);
    
    private static final int HEARTBEAT_INTERVAL = 10000;
    private static final int MAX_IDLE_TIME = 30000;
    private static final int MAX_MESSAGE_QUEUE_SIZE = 1000;
    private static final int MAX_RETRY_COUNT = 3;

    @OnOpen
    public void onOpen(Session session, 
                       @PathParam("clientType") String clientType,
                       @PathParam("clientId") String clientId) {
        String sessionId = session.getId();
        SESSION_MAP.put(sessionId, session);
        CLIENT_TYPE_MAP.put(sessionId, clientType);
        CLIENT_ID_MAP.put(sessionId, clientId);
        LAST_HEARTBEAT_MAP.put(sessionId, System.currentTimeMillis());
        LAST_PONG_MAP.put(sessionId, System.currentTimeMillis());
        MESSAGE_QUEUE_MAP.put(sessionId, new ConcurrentLinkedQueue<>());
        ONLINE_COUNT.incrementAndGet();
        
        session.setMaxIdleTimeout(MAX_IDLE_TIME);
        session.setMaxBinaryMessageBufferSize(1024 * 1024);
        session.setMaxTextMessageBufferSize(1024 * 1024);
        
        log.info("WebSocket连接建立，sessionId: {}, clientType: {}, clientId: {}, 当前在线数: {}", 
                sessionId, clientType, clientId, ONLINE_COUNT.get());
        
        sendMessage(session, JSON.toJSONString(Map.of(
                "type", "CONNECTED",
                "message", "连接成功",
                "sessionId", sessionId,
                "onlineCount", ONLINE_COUNT.get(),
                "timestamp", System.currentTimeMillis(),
                "heartbeatInterval", HEARTBEAT_INTERVAL
        )));
        
        flushMessageQueue(sessionId);
    }

    @OnClose
    public void onClose(Session session, CloseReason reason) {
        String sessionId = session.getId();
        String clientId = CLIENT_ID_MAP.get(sessionId);
        
        SESSION_MAP.remove(sessionId);
        CLIENT_TYPE_MAP.remove(sessionId);
        CLIENT_ID_MAP.remove(sessionId);
        LAST_HEARTBEAT_MAP.remove(sessionId);
        LAST_PONG_MAP.remove(sessionId);
        MESSAGE_QUEUE_MAP.remove(sessionId);
        ONLINE_COUNT.decrementAndGet();
        
        log.info("WebSocket连接关闭，sessionId: {}, clientId: {}, 原因: {}, 当前在线数: {}", 
                sessionId, clientId, reason.getReasonPhrase(), ONLINE_COUNT.get());
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        String sessionId = session.getId();
        LAST_HEARTBEAT_MAP.put(sessionId, System.currentTimeMillis());
        
        try {
            Map<String, Object> msg = JSON.parseObject(message, Map.class);
            String type = (String) msg.get("type");
            
            if ("PONG".equals(type)) {
                LAST_PONG_MAP.put(sessionId, System.currentTimeMillis());
                log.debug("收到PONG，sessionId: {}", sessionId);
                return;
            }
            
            if ("PING".equals(type)) {
                sendMessage(session, JSON.toJSONString(Map.of(
                        "type", "PONG",
                        "timestamp", System.currentTimeMillis()
                )));
                return;
            }
            
            if ("SYNC_REQUEST".equals(type)) {
                log.info("收到同步请求，sessionId: {}", sessionId);
                return;
            }
            
            log.info("收到消息，sessionId: {}, 消息类型: {}", sessionId, type);
        } catch (Exception e) {
            log.warn("消息解析失败，sessionId: {}, message: {}", sessionId, message);
        }
    }

    @OnError
    public void onError(Session session, Throwable error) {
        String sessionId = session.getId();
        log.error("WebSocket发生错误，sessionId: {}, 错误: {}", sessionId, error.getMessage());
    }

    public boolean sendMessage(Session session, String message) {
        return sendMessageWithRetry(session, message, 0);
    }

    private boolean sendMessageWithRetry(Session session, String message, int retryCount) {
        if (session == null || !session.isOpen()) {
            return false;
        }
        
        try {
            session.getBasicRemote().sendText(message);
            return true;
        } catch (IOException e) {
            log.warn("发送消息失败，重试次数: {}, sessionId: {}, 错误: {}", 
                    retryCount, session.getId(), e.getMessage());
            
            if (retryCount < MAX_RETRY_COUNT) {
                try {
                    Thread.sleep(100 * (retryCount + 1));
                    return sendMessageWithRetry(session, message, retryCount + 1);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
            
            queueMessage(session.getId(), message);
            return false;
        }
    }

    private void queueMessage(String sessionId, String message) {
        Queue<String> queue = MESSAGE_QUEUE_MAP.get(sessionId);
        if (queue != null) {
            while (queue.size() >= MAX_MESSAGE_QUEUE_SIZE) {
                queue.poll();
            }
            queue.offer(message);
            log.debug("消息加入队列，sessionId: {}, 队列大小: {}", sessionId, queue.size());
        }
    }

    private void flushMessageQueue(String sessionId) {
        Queue<String> queue = MESSAGE_QUEUE_MAP.get(sessionId);
        Session session = SESSION_MAP.get(sessionId);
        
        if (queue == null || session == null || !session.isOpen()) {
            return;
        }
        
        int flushCount = 0;
        while (!queue.isEmpty()) {
            String message = queue.poll();
            if (sendMessage(session, message)) {
                flushCount++;
            }
        }
        
        if (flushCount > 0) {
            log.info("刷新消息队列，sessionId: {}, 发送消息数: {}", sessionId, flushCount);
        }
    }

    @Scheduled(fixedRate = HEARTBEAT_INTERVAL)
    public void sendHeartbeat() {
        long currentTime = System.currentTimeMillis();
        
        SESSION_MAP.forEach((sessionId, session) -> {
            if (!session.isOpen()) {
                return;
            }
            
            Long lastPong = LAST_PONG_MAP.get(sessionId);
            if (lastPong != null && currentTime - lastPong > MAX_IDLE_TIME) {
                log.warn("心跳超时，关闭连接，sessionId: {}", sessionId);
                try {
                    session.close(new CloseReason(CloseReason.CloseCodes.GOING_AWAY, "心跳超时"));
                } catch (IOException e) {
                    log.error("关闭连接失败", e);
                }
                return;
            }
            
            sendMessage(session, JSON.toJSONString(Map.of(
                    "type", "PING",
                    "timestamp", currentTime,
                    "serverTime", currentTime
            )));
        });
    }

    public void broadcast(String message) {
        broadcast(message, false);
    }

    public void broadcast(String message, boolean guaranteed) {
        SESSION_MAP.forEach((sessionId, session) -> {
            if (session.isOpen()) {
                boolean success = sendMessage(session, message);
                if (!success && guaranteed) {
                    queueMessage(sessionId, message);
                }
            } else if (guaranteed) {
                queueMessage(sessionId, message);
            }
        });
    }

    public void broadcastToClientType(String clientType, String message, boolean guaranteed) {
        SESSION_MAP.forEach((sessionId, session) -> {
            if (session.isOpen() && clientType.equals(CLIENT_TYPE_MAP.get(sessionId))) {
                boolean success = sendMessage(session, message);
                if (!success && guaranteed) {
                    queueMessage(sessionId, message);
                }
            } else if (guaranteed && clientType.equals(CLIENT_TYPE_MAP.get(sessionId))) {
                queueMessage(sessionId, message);
            }
        });
    }

    public void broadcastParkingSpaceUpdate(Long parkingLotId, Long spaceId, String status, 
                                            String area, String spaceNo, String plateNumber) {
        String message = JSON.toJSONString(Map.of(
                "type", "PARKING_SPACE_UPDATE",
                "parkingLotId", parkingLotId,
                "spaceId", spaceId,
                "area", area != null ? area : "",
                "spaceNo", spaceNo != null ? spaceNo : "",
                "plateNumber", plateNumber != null ? plateNumber : "",
                "status", status,
                "timestamp", System.currentTimeMillis(),
                "guaranteed", true
        ));
        broadcast(message, true);
        log.info("广播车位状态更新，parkingLotId: {}, spaceId: {}, status: {}", parkingLotId, spaceId, status);
    }

    public void broadcastVehicleEntry(Long parkingLotId, String plateNumber, Long spaceId, String entryTime) {
        String message = JSON.toJSONString(Map.of(
                "type", "VEHICLE_ENTRY",
                "parkingLotId", parkingLotId,
                "plateNumber", plateNumber,
                "spaceId", spaceId,
                "entryTime", entryTime,
                "timestamp", System.currentTimeMillis(),
                "guaranteed", true
        ));
        broadcastToClientType("booth", message, true);
        broadcastToClientType("admin", message, true);
        log.info("广播车辆入场，parkingLotId: {}, plateNumber: {}", parkingLotId, plateNumber);
    }

    public void broadcastVehicleExit(Long parkingLotId, String plateNumber, String amount, Long spaceId) {
        String message = JSON.toJSONString(Map.of(
                "type", "VEHICLE_EXIT",
                "parkingLotId", parkingLotId,
                "plateNumber", plateNumber,
                "spaceId", spaceId,
                "amount", amount,
                "timestamp", System.currentTimeMillis(),
                "guaranteed", true
        ));
        broadcast(message, true);
        log.info("广播车辆离场，parkingLotId: {}, plateNumber: {}, 金额: {}", parkingLotId, plateNumber, amount);
    }
    
    public void broadcastFullSync(String clientType) {
        log.info("广播全量同步，clientType: {}", clientType);
    }

    public static int getOnlineCount() {
        return ONLINE_COUNT.get();
    }

    public static int getQueueSize(String sessionId) {
        Queue<String> queue = MESSAGE_QUEUE_MAP.get(sessionId);
        return queue != null ? queue.size() : 0;
    }
}
