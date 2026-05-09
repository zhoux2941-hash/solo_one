package com.iot.light.service;

import com.iot.light.config.MqttConfig;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class LightControlService {

    private final MqttConfig mqttConfig;
    private MqttClient mqttClient;
    
    @Getter
    private volatile String currentLightStatus = "OFF";
    
    private static final String STATUS_ON = "ON";
    private static final String STATUS_OFF = "OFF";
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    public LightControlService(MqttConfig mqttConfig) {
        this.mqttConfig = mqttConfig;
    }

    @PostConstruct
    public void init() {
        log.info("========================================");
        log.info("物联网灯光控制平台后端启动");
        log.info("========================================");
        log.info("MQTT Broker URL: {}", mqttConfig.getBrokerUrl());
        log.info("客户端ID: {}", mqttConfig.getClientId());
        log.info("控制主题: {}", mqttConfig.getTopicControl());
        log.info("状态主题: {}", mqttConfig.getTopicStatus());
        log.info("========================================");
        
        connectMQTT();
    }

    private void connectMQTT() {
        try {
            log.info("[{}] 正在连接 MQTT Broker...", getCurrentTime());
            
            mqttClient = new MqttClient(mqttConfig.getBrokerUrl(), mqttConfig.getClientId());
            
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setConnectionTimeout(mqttConfig.getConnectionTimeout());
            options.setKeepAliveInterval(mqttConfig.getKeepAlive());
            options.setAutomaticReconnect(true);
            
            mqttClient.setCallback(new MqttCallback() {
                @Override
                public void connectionLost(Throwable cause) {
                    log.error("[{}] MQTT 连接丢失: {}", getCurrentTime(), cause.getMessage());
                }

                @Override
                public void messageArrived(String topic, MqttMessage message) throws Exception {
                    String payload = new String(message.getPayload());
                    handleIncomingMessage(topic, payload);
                }

                @Override
                public void deliveryComplete(IMqttDeliveryToken token) {
                    log.debug("[{}] 消息发送完成", getCurrentTime());
                }
            });
            
            mqttClient.connect(options);
            log.info("[{}] 成功连接到 MQTT Broker", getCurrentTime());
            
            subscribeToControlTopic();
            publishCurrentStatus();
            
        } catch (MqttException e) {
            log.error("[{}] MQTT 连接失败: {}", getCurrentTime(), e.getMessage(), e);
        }
    }

    private void subscribeToControlTopic() {
        try {
            mqttClient.subscribe(mqttConfig.getTopicControl(), (topic, message) -> {
                String payload = new String(message.getPayload());
                log.info("[{}] ========================================", getCurrentTime());
                log.info("[{}] 收到控制消息", getCurrentTime());
                log.info("[{}] 主题: {}", getCurrentTime(), topic);
                log.info("[{}] 内容: {}", getCurrentTime(), payload);
                log.info("[{}] QoS: {}", getCurrentTime(), message.getQos());
                
                processControlCommand(payload);
            });
            log.info("[{}] 已订阅控制主题: {}", getCurrentTime(), mqttConfig.getTopicControl());
        } catch (MqttException e) {
            log.error("[{}] 订阅主题失败: {}", getCurrentTime(), e.getMessage());
        }
    }

    private void handleIncomingMessage(String topic, String payload) {
        log.info("[{}] 收到消息 - 主题: {}, 内容: {}", getCurrentTime(), topic, payload);
    }

    private void processControlCommand(String command) {
        log.info("[{}] 开始处理控制命令: {}", getCurrentTime(), command);
        
        String newStatus;
        
        switch (command.toUpperCase()) {
            case STATUS_ON:
                newStatus = STATUS_ON;
                log.info("[{}] ========================================", getCurrentTime());
                log.info("[{}] 执行开灯操作", getCurrentTime());
                log.info("[{}] 模拟硬件操作: 发送信号到灯...", getCurrentTime());
                log.info("[{}] 灯已成功开启!", getCurrentTime());
                log.info("[{}] ========================================", getCurrentTime());
                break;
            case STATUS_OFF:
                newStatus = STATUS_OFF;
                log.info("[{}] ========================================", getCurrentTime());
                log.info("[{}] 执行关灯操作", getCurrentTime());
                log.info("[{}] 模拟硬件操作: 发送信号到灯...", getCurrentTime());
                log.info("[{}] 灯已成功关闭!", getCurrentTime());
                log.info("[{}] ========================================", getCurrentTime());
                break;
            default:
                log.warn("[{}] 未知的控制命令: {}", getCurrentTime(), command);
                return;
        }
        
        this.currentLightStatus = newStatus;
        log.info("[{}] 当前灯状态已更新为: {}", getCurrentTime(), currentLightStatus);
        
        publishCurrentStatus();
    }

    public void publishCurrentStatus() {
        publishStatus(currentLightStatus);
    }

    private void publishStatus(String status) {
        if (mqttClient == null || !mqttClient.isConnected()) {
            log.warn("[{}] MQTT 客户端未连接，无法发送状态", getCurrentTime());
            return;
        }
        
        try {
            MqttMessage message = new MqttMessage(status.getBytes());
            message.setQos(1);
            message.setRetained(true);
            
            mqttClient.publish(mqttConfig.getTopicStatus(), message);
            log.info("[{}] ========================================", getCurrentTime());
            log.info("[{}] 发布灯状态", getCurrentTime());
            log.info("[{}] 主题: {}", getCurrentTime(), mqttConfig.getTopicStatus());
            log.info("[{}] 内容: {}", getCurrentTime(), status);
            log.info("[{}] ========================================", getCurrentTime());
        } catch (MqttException e) {
            log.error("[{}] 发布状态失败: {}", getCurrentTime(), e.getMessage());
        }
    }

    public void controlLight(String command) {
        log.info("[{}] 接收到 API 控制请求: {}", getCurrentTime(), command);
        processControlCommand(command);
    }

    private String getCurrentTime() {
        return LocalDateTime.now().format(formatter);
    }

    @PreDestroy
    public void destroy() {
        log.info("[{}] 正在关闭 MQTT 连接...", getCurrentTime());
        try {
            if (mqttClient != null) {
                mqttClient.disconnect();
                mqttClient.close();
                log.info("[{}] MQTT 连接已关闭", getCurrentTime());
            }
        } catch (MqttException e) {
            log.error("[{}] 关闭 MQTT 连接时出错: {}", getCurrentTime(), e.getMessage());
        }
    }
}
