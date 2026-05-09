package com.exam.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "exam")
public class ExamProperties {
    
    private WebSocketConfig websocket = new WebSocketConfig();
    private CheatBufferConfig cheatBuffer = new CheatBufferConfig();
    
    @Data
    public static class WebSocketConfig {
        private int maxConnectionsPerExam = 100;
        private int maxTotalConnections = 1000;
    }
    
    @Data
    public static class CheatBufferConfig {
        private String bufferKey = "cheat:buffer";
        private int batchSize = 200;
        private int flushIntervalSeconds = 2;
    }
}
