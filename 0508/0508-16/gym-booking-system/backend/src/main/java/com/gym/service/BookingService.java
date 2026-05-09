package com.gym.service;

import com.gym.dto.BookingMessage;
import com.gym.entity.Booking;
import com.gym.entity.Booking.BookingStatus;
import com.gym.entity.Course;
import com.gym.repository.BookingRepository;
import com.gym.repository.CourseRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class BookingService {
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private RedisCacheService redisCacheService;
    
    @Autowired
    private MessageQueueService messageQueueService;
    
    @Autowired
    private CompensationService compensationService;
    
    /**
     * 预约课程（新的原子预约流程）
     * 1. 检查前置条件（重复预约、课程是否开始）
     * 2. 使用Lua脚本原子检查并扣减Redis中的名额
     * 3. 发送消息到消息队列，异步创建预约记录
     * 4. 如果后续创建失败，通过补偿机制恢复名额
     */
    public BookingMessage bookCourseAtomically(Long userId, String userName, Long courseId) {
        log.info("开始原子预约流程: userId={}, userName={}, courseId={}", userId, userName, courseId);
        
        Optional<Booking> existingBooking = bookingRepository.findByUserIdAndCourseId(userId, courseId);
        if (existingBooking.isPresent()) {
            throw new RuntimeException("您已经预约过这门课程了");
        }
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        if (course.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("课程已经开始，无法预约");
        }
        
        int remaining = redisCacheService.decreaseCapacityAtomically(courseId, course.getCapacity());
        
        if (remaining == -1) {
            throw new RuntimeException("课程名额已满");
        }
        
        if (remaining == -2) {
            throw new RuntimeException("课程信息初始化失败，请稍后重试");
        }
        
        log.info("Redis名额扣减成功: courseId={}, 剩余名额={}", courseId, remaining);
        
        BookingMessage message = BookingMessage.create(userId, userName, courseId, course.getCapacity());
        
        boolean sent = messageQueueService.sendToPendingQueue(message);
        
        if (!sent) {
            log.error("消息发送失败，执行补偿操作: messageId={}", message.getMessageId());
            redisCacheService.increaseCapacityAtomically(courseId, course.getCapacity());
            throw new RuntimeException("预约消息发送失败，请稍后重试");
        }
        
        log.info("预约消息已发送: messageId={}, courseId={}, remaining={}", 
            message.getMessageId(), courseId, remaining);
        
        return message;
    }
    
    /**
     * 取消预约
     * 使用Lua脚本原子恢复名额
     */
    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        if (booking.getStatus() != BookingStatus.BOOKED) {
            throw new RuntimeException("只有预约状态的课程才能取消");
        }
        
        Course course = courseRepository.findById(booking.getCourseId())
                .orElse(null);
        
        bookingRepository.delete(booking);
        
        if (course != null) {
            int result = redisCacheService.increaseCapacityAtomically(
                booking.getCourseId(), 
                course.getCapacity()
            );
            
            if (result >= 0) {
                log.info("取消预约成功，名额已恢复: bookingId={}, courseId={}, 剩余名额={}", 
                    bookingId, booking.getCourseId(), result);
            } else {
                log.warn("取消预约后恢复名额异常: bookingId={}, courseId={}, result={}", 
                    bookingId, booking.getCourseId(), result);
            }
        } else {
            redisCacheService.increaseCapacity(booking.getCourseId());
            log.warn("课程不存在，使用非原子方式恢复名额: bookingId={}, courseId={}", 
                bookingId, booking.getCourseId());
        }
    }
    
    /**
     * 签到
     */
    @Transactional
    public Booking checkIn(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        Course course = courseRepository.findById(booking.getCourseId())
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime checkInStart = course.getStartTime().minusMinutes(30);
        LocalDateTime checkInEnd = course.getStartTime();
        
        if (now.isBefore(checkInStart)) {
            throw new RuntimeException("签到时间还未开始，请在课程开始前30分钟内签到");
        }
        
        if (now.isAfter(checkInEnd)) {
            throw new RuntimeException("签到时间已过");
        }
        
        booking.setStatus(BookingStatus.CHECKED_IN);
        booking.setCheckinTime(now);
        
        return bookingRepository.save(booking);
    }
    
    @Deprecated
    @Transactional
    public Booking bookCourse(Long userId, String userName, Long courseId) {
        return null;
    }
    
    public List<Booking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId);
    }
    
    public List<Booking> getBookingsByCourse(Long courseId) {
        return bookingRepository.findByCourseId(courseId);
    }
    
    public Optional<Booking> getBookingByUserAndCourse(Long userId, Long courseId) {
        return bookingRepository.findByUserIdAndCourseId(userId, courseId);
    }
    
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void markNoShows() {
        List<Booking> expiredBookings = bookingRepository.findExpiredBookings(LocalDateTime.now());
        for (Booking booking : expiredBookings) {
            if (booking.getStatus() == BookingStatus.BOOKED) {
                booking.setStatus(BookingStatus.NO_SHOW);
                bookingRepository.save(booking);
                log.info("标记爽约: bookingId={}, userId={}, courseId={}", 
                    booking.getBookingId(), booking.getUserId(), booking.getCourseId());
            }
        }
    }
}
