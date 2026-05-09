package com.company.docsearch.controller;

import com.company.docsearch.service.SearchLogBufferService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final SearchLogBufferService bufferService;
    private final StringRedisTemplate stringRedisTemplate;
    private final RedisConnectionFactory redisConnectionFactory;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");

        Map<String, Object> details = new HashMap<>();

        long pendingLogs = bufferService.getPendingLogCount();
        details.put("pendingSearchLogs", pendingLogs);

        try {
            redisConnectionFactory.getConnection().ping();
            details.put("redis", "OK");
        } catch (Exception e) {
            details.put("redis", "DOWN");
            status.put("status", "DEGRADED");
        }

        try {
            stringRedisTemplate.opsForValue().get("health_check");
            details.put("redisTemplate", "OK");
        } catch (Exception e) {
            details.put("redisTemplate", "DOWN");
        }

        status.put("details", details);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/buffer")
    public ResponseEntity<Map<String, Object>> bufferStatus() {
        Map<String, Object> status = new HashMap<>();

        try {
            Long logBufferSize = stringRedisTemplate.opsForList().size("search_log_buffer");
            Long clickBufferSize = stringRedisTemplate.opsForHash().size("pending_clicks");
            Set<Object> hotSearchBuffer = stringRedisTemplate.opsForZSet().range("hot_search_buffer", 0, -1);

            status.put("searchLogBufferCount", logBufferSize != null ? logBufferSize : 0);
            status.put("pendingClickCount", clickBufferSize != null ? clickBufferSize : 0);
            status.put("hotSearchBufferKeyCount", hotSearchBuffer != null ? hotSearchBuffer.size() : 0);

            if (logBufferSize != null && logBufferSize > 5000) {
                status.put("warning", "日志缓冲区较大，请检查批量写入任务是否正常运行");
            }
        } catch (Exception e) {
            status.put("error", e.getMessage());
        }

        return ResponseEntity.ok(status);
    }
}
