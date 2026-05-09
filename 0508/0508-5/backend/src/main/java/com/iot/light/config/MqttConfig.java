package com.iot.light.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "mqtt")
public class MqttConfig {
    private String brokerUrl;
    private String clientId;
    private String topicControl;
    private String topicStatus;
    private int connectionTimeout = 10;
    private int keepAlive = 20;
}
