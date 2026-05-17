package com.buscompany.fatigue.websocket;

import com.alibaba.fastjson.JSON;
import com.buscompany.fatigue.entity.Alert;
import com.buscompany.fatigue.entity.DeviceData;
import com.buscompany.fatigue.entity.Driver;
import org.springframework.stereotype.Component;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.concurrent.CopyOnWriteArraySet;

@ServerEndpoint("/ws/alerts")
@Component
public class AlertWebSocket {
    private static CopyOnWriteArraySet<Session> sessions = new CopyOnWriteArraySet<>();

    @OnOpen
    public void onOpen(Session session) {
        sessions.add(session);
        System.out.println("新连接加入，当前连接数: " + sessions.size());
    }

    @OnClose
    public void onClose(Session session) {
        sessions.remove(session);
        System.out.println("连接关闭，当前连接数: " + sessions.size());
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        System.out.println("收到客户端消息: " + message);
    }

    @OnError
    public void onError(Session session, Throwable error) {
        error.printStackTrace();
    }

    public static void broadcastAlert(Alert alert) {
        broadcastMessage("alert", alert);
    }

    public static void broadcastDeviceData(DeviceData deviceData) {
        broadcastMessage("deviceData", deviceData);
    }

    public static void broadcastDriverStatusUpdate(Driver driver) {
        broadcastMessage("driverStatus", driver);
    }

    public static void broadcastMessage(String type, Object data) {
        String message = JSON.toJSONString(new WsMessage(type, data));
        for (Session session : sessions) {
            try {
                session.getBasicRemote().sendText(message);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public static class WsMessage {
        private String type;
        private Object data;

        public WsMessage(String type, Object data) {
            this.type = type;
            this.data = data;
        }

        public String getType() {
            return type;
        }

        public Object getData() {
            return data;
        }
    }
}
