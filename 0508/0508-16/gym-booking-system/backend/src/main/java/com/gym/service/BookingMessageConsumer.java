package com.gym.service;

import com.gym.dto.BookingMessage;
import com.gym.entity.Booking;
import com.gym.entity.Booking.BookingStatus;
import com.gym.entity.Course;
import com.gym.repository.BookingRepository;
import com.gym.repository.CourseRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
public class BookingMessageConsumer {
    
    @Autowired
    private MessageQueueService messageQueueService;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private RedisCacheService redisCacheService;
    
    @Autowired
    private CompensationService compensationService;
    
    private ExecutorService executorService;
    private final AtomicBoolean running = new AtomicBoolean(true);
    
    @PostConstruct
    public void init() {
        executorService = Executors.newFixedThreadPool(2);
        startConsumer();
        log.info("预约消息消费者已启动");
    }
    
    @PreDestroy
    public void destroy() {
        running.set(false);
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(10, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
        }
        log.info("预约消息消费者已停止");
    }
    
    private void startConsumer() {
        executorService.submit(this::consumeLoop);
    }
    
    private void consumeLoop() {
        while (running.get()) {
            try {
                BookingMessage message = messageQueueService.pollFromPendingQueue();
                
                if (message == null) {
                    continue;
                }
                
                processMessage(message);
                
            } catch (Exception e) {
                log.error("消息消费循环发生异常", e);
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }
    
    @Async
    @Transactional(rollbackFor = Exception.class)
    public void processMessage(BookingMessage message) {
        log.info("开始处理预约消息: {}", message.getMessageId());
        
        if (message.isExpired()) {
            log.warn("消息已过期，进入补偿流程: {}", message.getMessageId());
            handleCompensation(message, "消息已过期");
            return;
        }
        
        try {
            messageQueueService.sendToProcessingQueue(message);
            
            Optional<Booking> existingBooking = bookingRepository.findByUserIdAndCourseId(
                message.getUserId(), 
                message.getCourseId()
            );
            
            if (existingBooking.isPresent()) {
                log.warn("用户已预约过该课程，消息幂等处理: messageId={}, userId={}, courseId={}", 
                    message.getMessageId(), message.getUserId(), message.getCourseId());
                messageQueueService.removeFromProcessingQueue(message);
                messageQueueService.removeFromMessageSet(message.getMessageId());
                return;
            }
            
            Optional<Course> courseOpt = courseRepository.findById(message.getCourseId());
            if (!courseOpt.isPresent()) {
                log.error("课程不存在: courseId={}", message.getCourseId());
                handleCompensation(message, "课程不存在");
                return;
            }
            
            Booking booking = new Booking();
            booking.setUserId(message.getUserId());
            booking.setUserName(message.getUserName());
            booking.setCourseId(message.getCourseId());
            booking.setBookTime(message.getBookTime());
            booking.setStatus(BookingStatus.BOOKED);
            
            bookingRepository.save(booking);
            
            messageQueueService.removeFromProcessingQueue(message);
            messageQueueService.removeFromMessageSet(message.getMessageId());
            
            log.info("预约记录创建成功: messageId={}, bookingId={}", 
                message.getMessageId(), booking.getBookingId());
            
        } catch (Exception e) {
            log.error("处理预约消息失败: messageId={}", message.getMessageId(), e);
            
            if (message.shouldRetry()) {
                message.incrementRetryCount();
                log.info("消息重试: messageId={}, retryCount={}", message.getMessageId(), message.getRetryCount());
                messageQueueService.removeFromProcessingQueue(message);
                messageQueueService.sendToPendingQueue(message);
            } else {
                log.error("消息重试次数用尽，进入补偿流程: messageId={}", message.getMessageId());
                handleCompensation(message, "重试次数用尽: " + e.getMessage());
            }
        }
    }
    
    private void handleCompensation(BookingMessage message, String reason) {
        try {
            compensationService.compensateBooking(message, reason);
            messageQueueService.removeFromProcessingQueue(message);
            messageQueueService.removeFromMessageSet(message.getMessageId());
        } catch (Exception e) {
            log.error("补偿处理失败，消息将进入死信队列: messageId={}", message.getMessageId(), e);
            messageQueueService.sendToDLQ(message);
            messageQueueService.removeFromProcessingQueue(message);
            messageQueueService.removeFromMessageSet(message.getMessageId());
        }
    }
}
