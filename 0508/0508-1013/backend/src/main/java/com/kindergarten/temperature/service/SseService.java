package com.kindergarten.temperature.service;

import com.alibaba.fastjson.JSON;
import com.kindergarten.temperature.dto.TemperatureSnapshot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseService {

    private static final Logger logger = LoggerFactory.getLogger(SseService.class);
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            logger.info("SSE连接完成，剩余连接数: {}", emitters.size());
        });

        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            logger.info("SSE连接超时，剩余连接数: {}", emitters.size());
        });

        emitter.onError(e -> {
            emitters.remove(emitter);
            logger.error("SSE连接错误，剩余连接数: {}", emitters.size(), e);
        });

        logger.info("新的SSE连接已建立，当前连接数: {}", emitters.size());
        return emitter;
    }

    public void sendTemperatureUpdate(TemperatureSnapshot snapshot) {
        String jsonData = JSON.toJSONString(snapshot);
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("temperature-update")
                        .data(jsonData));
            } catch (IOException e) {
                emitters.remove(emitter);
                logger.error("发送SSE消息失败，移除连接", e);
            }
        }
    }

    @Scheduled(fixedRate = 15000)
    public void sendHeartbeat() {
        if (emitters.isEmpty()) {
            return;
        }
        logger.debug("发送SSE心跳，当前连接数: {}", emitters.size());
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("heartbeat")
                        .data("ping"));
            } catch (IOException e) {
                emitters.remove(emitter);
                logger.error("发送心跳失败，移除连接", e);
            }
        }
    }

    public int getConnectionCount() {
        return emitters.size();
    }
}
