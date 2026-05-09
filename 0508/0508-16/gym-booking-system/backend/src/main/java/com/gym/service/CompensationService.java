package com.gym.service;

import com.gym.dto.BookingMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class CompensationService {
    
    @Autowired
    private RedisCacheService redisCacheService;
    
    @Autowired
    private MessageQueueService messageQueueService;
    
    private final Map<String, CompensationRecord> compensationRecords = new ConcurrentHashMap<>();
    
    public static class CompensationRecord {
        private String messageId;
        private Long courseId;
        private Integer capacity;
        private String reason;
        private LocalDateTime compensateTime;
        private boolean success;
        
        public CompensationRecord(String messageId, Long courseId, Integer capacity, String reason) {
            this.messageId = messageId;
            this.courseId = courseId;
            this.capacity = capacity;
            this.reason = reason;
            this.compensateTime = LocalDateTime.now();
            this.success = false;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public boolean isSuccess() {
            return success;
        }
        
        public String getMessageId() {
            return messageId;
        }
        
        public Long getCourseId() {
            return courseId;
        }
        
        public Integer getCapacity() {
            return capacity;
        }
        
        public String getReason() {
            return reason;
        }
        
        public LocalDateTime getCompensateTime() {
            return compensateTime;
        }
    }
    
    /**
     * 执行补偿操作：恢复Redis中的名额
     */
    public void compensateBooking(BookingMessage message, String reason) {
        log.info("开始执行补偿操作: messageId={}, courseId={}, reason={}", 
            message.getMessageId(), message.getCourseId(), reason);
        
        CompensationRecord record = new CompensationRecord(
            message.getMessageId(),
            message.getCourseId(),
            message.getCapacity(),
            reason
        );
        
        compensationRecords.put(message.getMessageId(), record);
        
        try {
            int result = redisCacheService.increaseCapacityAtomically(
                message.getCourseId(), 
                message.getCapacity()
            );
            
            if (result >= 0) {
                record.setSuccess(true);
                log.info("补偿成功: messageId={}, courseId={}, 恢复后剩余名额={}", 
                    message.getMessageId(), message.getCourseId(), result);
            } else if (result == -1) {
                record.setSuccess(true);
                log.warn("补偿跳过（已达最大容量）: messageId={}, courseId={}", 
                    message.getMessageId(), message.getCourseId());
            } else {
                record.setSuccess(false);
                log.error("补偿失败（缓存不存在）: messageId={}, courseId={}", 
                    message.getMessageId(), message.getCourseId());
                throw new RuntimeException("补偿失败：课程缓存不存在");
            }
            
        } catch (Exception e) {
            record.setSuccess(false);
            log.error("补偿操作异常: messageId={}", message.getMessageId(), e);
            throw e;
        }
    }
    
    /**
     * 手动补偿死信队列中的消息
     */
    public void compensateDLQ() {
        log.info("开始手动补偿死信队列");
        long dlqSize = messageQueueService.getDLQSize();
        
        if (dlqSize == 0) {
            log.info("死信队列为空，无需补偿");
            return;
        }
        
        log.info("死信队列中有 {} 条消息待处理", dlqSize);
    }
    
    /**
     * 获取补偿记录
     */
    public CompensationRecord getCompensationRecord(String messageId) {
        return compensationRecords.get(messageId);
    }
    
    /**
     * 清理过期的补偿记录
     */
    public void cleanupExpiredRecords() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        compensationRecords.entrySet().removeIf(entry -> 
            entry.getValue().getCompensateTime().isBefore(threshold)
        );
        log.info("已清理过期的补偿记录");
    }
}
