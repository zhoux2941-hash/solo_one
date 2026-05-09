package com.gym.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.gym.dto.BookingMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class MessageQueueService {
    
    private static final String BOOKING_QUEUE = "queue:booking:pending";
    private static final String BOOKING_PROCESSING = "queue:booking:processing";
    private static final String BOOKING_DLQ = "queue:booking:dlq";
    private static final String BOOKING_SET = "set:booking:messages";
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    private ObjectMapper objectMapper;
    
    @PostConstruct
    public void init() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }
    
    public boolean sendToPendingQueue(BookingMessage message) {
        try {
            String messageId = message.getMessageId();
            String messageJson = objectMapper.writeValueAsString(message);
            
            if (Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(BOOKING_SET, messageId))) {
                log.warn("消息已存在，避免重复发送: {}", messageId);
                return true;
            }
            
            redisTemplate.opsForList().rightPush(BOOKING_QUEUE, messageJson);
            redisTemplate.opsForSet().add(BOOKING_SET, messageId);
            redisTemplate.expire(BOOKING_SET, 1, TimeUnit.HOURS);
            
            log.info("预约消息已发送到待处理队列: {}", messageId);
            return true;
        } catch (JsonProcessingException e) {
            log.error("序列化预约消息失败", e);
            return false;
        }
    }
    
    public BookingMessage pollFromPendingQueue() {
        try {
            Object messageJson = redisTemplate.opsForList().leftPop(BOOKING_QUEUE, 5, TimeUnit.SECONDS);
            if (messageJson == null) {
                return null;
            }
            
            BookingMessage message = objectMapper.readValue(messageJson.toString(), BookingMessage.class);
            log.info("从待处理队列获取消息: {}", message.getMessageId());
            return message;
        } catch (JsonProcessingException e) {
            log.error("反序列化预约消息失败", e);
            return null;
        }
    }
    
    public void sendToProcessingQueue(BookingMessage message) {
        try {
            String messageJson = objectMapper.writeValueAsString(message);
            redisTemplate.opsForList().rightPush(BOOKING_PROCESSING, messageJson);
            log.info("消息已发送到处理中队列: {}", message.getMessageId());
        } catch (JsonProcessingException e) {
            log.error("序列化预约消息失败", e);
        }
    }
    
    public void sendToDLQ(BookingMessage message) {
        try {
            String messageJson = objectMapper.writeValueAsString(message);
            redisTemplate.opsForList().rightPush(BOOKING_DLQ, messageJson);
            log.warn("消息已发送到死信队列: {}", message.getMessageId());
        } catch (JsonProcessingException e) {
            log.error("序列化预约消息失败", e);
        }
    }
    
    public void removeFromProcessingQueue(BookingMessage message) {
        try {
            String messageJson = objectMapper.writeValueAsString(message);
            redisTemplate.opsForList().remove(BOOKING_PROCESSING, 1, messageJson);
            log.info("消息已从处理中队列移除: {}", message.getMessageId());
        } catch (JsonProcessingException e) {
            log.error("序列化预约消息失败", e);
        }
    }
    
    public void removeFromMessageSet(String messageId) {
        redisTemplate.opsForSet().remove(BOOKING_SET, messageId);
        log.debug("消息已从去重集合移除: {}", messageId);
    }
    
    public long getPendingQueueSize() {
        Long size = redisTemplate.opsForList().size(BOOKING_QUEUE);
        return size != null ? size : 0;
    }
    
    public long getProcessingQueueSize() {
        Long size = redisTemplate.opsForList().size(BOOKING_PROCESSING);
        return size != null ? size : 0;
    }
    
    public long getDLQSize() {
        Long size = redisTemplate.opsForList().size(BOOKING_DLQ);
        return size != null ? size : 0;
    }
}
