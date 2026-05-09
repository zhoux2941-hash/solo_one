package com.exam.service;

import com.alibaba.fastjson2.JSON;
import com.exam.config.ExamProperties;
import com.exam.entity.CheatLog;
import com.exam.repository.CheatLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class CheatBufferService {
    
    private final StringRedisTemplate stringRedisTemplate;
    private final CheatLogRepository cheatLogRepository;
    private final ExamProperties examProperties;
    
    public CheatBufferService(StringRedisTemplate stringRedisTemplate,
                             CheatLogRepository cheatLogRepository,
                             ExamProperties examProperties) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.cheatLogRepository = cheatLogRepository;
        this.examProperties = examProperties;
    }
    
    public void pushToBuffer(CheatLog cheatLog) {
        String json = JSON.toJSONString(cheatLog);
        stringRedisTemplate.opsForList()
                .rightPush(examProperties.getCheatBuffer().getBufferKey(), json);
        log.debug("Pushed cheat log to buffer: userId={}, actionType={}", 
                cheatLog.getUserId(), cheatLog.getActionType());
    }
    
    @Scheduled(fixedRateString = "${exam.cheat-buffer.flush-interval-seconds:2000}", timeUnit = TimeUnit.MILLISECONDS)
    @Transactional
    public void flushBufferToDatabase() {
        String bufferKey = examProperties.getCheatBuffer().getBufferKey();
        int batchSize = examProperties.getCheatBuffer().getBatchSize();
        
        Long bufferSize = stringRedisTemplate.opsForList().size(bufferKey);
        if (bufferSize == null || bufferSize == 0) {
            return;
        }
        
        log.debug("Flushing cheat buffer. Size: {}, BatchSize: {}", bufferSize, batchSize);
        
        int totalFlushed = 0;
        
        while (true) {
            List<String> batch = stringRedisTemplate.opsForList()
                    .leftPop(bufferKey, batchSize);
            
            if (batch == null || batch.isEmpty()) {
                break;
            }
            
            List<CheatLog> cheatLogs = new ArrayList<>();
            for (String json : batch) {
                try {
                    CheatLog log = JSON.parseObject(json, CheatLog.class);
                    if (log != null) {
                        cheatLogs.add(log);
                    }
                } catch (Exception e) {
                    log.error("Failed to parse cheat log JSON: {}", json, e);
                }
            }
            
            if (!cheatLogs.isEmpty()) {
                try {
                    cheatLogRepository.saveAll(cheatLogs);
                    totalFlushed += cheatLogs.size();
                    
                    for (CheatLog cheatLog : cheatLogs) {
                        String redisKey = String.format("cheat:exam:%d:user:%d", 
                                cheatLog.getExamId(), cheatLog.getUserId());
                        stringRedisTemplate.opsForValue().increment(redisKey);
                        
                        String typeKey = String.format("cheat:exam:%d:user:%d:type:%s", 
                                cheatLog.getExamId(), cheatLog.getUserId(), cheatLog.getActionType());
                        stringRedisTemplate.opsForValue().increment(typeKey);
                    }
                    
                    log.debug("Flushed {} cheat logs to database", cheatLogs.size());
                } catch (Exception e) {
                    log.error("Failed to save cheat logs batch", e);
                    batch.forEach(json -> stringRedisTemplate.opsForList()
                            .rightPush(bufferKey, json));
                }
            }
            
            if (batch.size() < batchSize) {
                break;
            }
        }
        
        if (totalFlushed > 0) {
            log.info("Total flushed cheat logs: {}", totalFlushed);
        }
    }
    
    public Long getBufferSize() {
        Long size = stringRedisTemplate.opsForList()
                .size(examProperties.getCheatBuffer().getBufferKey());
        return size != null ? size : 0L;
    }
    
    public void clearBuffer() {
        stringRedisTemplate.delete(examProperties.getCheatBuffer().getBufferKey());
        log.info("Cheat buffer cleared");
    }
}
