package com.company.seatbooking.service;

import com.company.seatbooking.dto.BookingRequest;
import com.company.seatbooking.entity.Booking;
import com.company.seatbooking.entity.Booking.BookingStatus;
import com.company.seatbooking.entity.Booking.TimeSlot;
import com.company.seatbooking.entity.Seat;
import com.company.seatbooking.repository.BookingRepository;
import com.company.seatbooking.repository.SeatRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class BookingService {
    
    private static final Logger logger = LoggerFactory.getLogger(BookingService.class);
    
    private static final long LOCK_WAIT_TIME = 10;
    private static final long LOCK_LEASE_TIME = 60;
    
    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;
    private final SeatStatusCacheService seatStatusCacheService;
    private final DistributedLockService distributedLockService;
    
    public BookingService(BookingRepository bookingRepository,
                          SeatRepository seatRepository,
                          SeatStatusCacheService seatStatusCacheService,
                          DistributedLockService distributedLockService) {
        this.bookingRepository = bookingRepository;
        this.seatRepository = seatRepository;
        this.seatStatusCacheService = seatStatusCacheService;
        this.distributedLockService = distributedLockService;
    }
    
    @Transactional
    public Booking createBooking(BookingRequest request) {
        TimeSlot timeSlot = TimeSlot.valueOf(request.getTimeSlot().toUpperCase());
        String dateStr = request.getDate().toString();
        
        List<String> lockKeys = getLockKeys(request.getSeatId(), dateStr, timeSlot);
        
        logger.info("开始预订流程: seatId={}, date={}, timeSlot={}, 需要获取的锁: {}",
                    request.getSeatId(), dateStr, timeSlot, lockKeys);
        
        List<DistributedLockService.LockContext> acquiredLocks = new ArrayList<>();
        
        try {
            for (String lockKey : lockKeys) {
                logger.debug("尝试获取锁: {}", lockKey);
                DistributedLockService.LockContext lock = distributedLockService.lock(
                    lockKey,
                    LOCK_WAIT_TIME, TimeUnit.SECONDS,
                    LOCK_LEASE_TIME, TimeUnit.SECONDS
                );
                acquiredLocks.add(lock);
                logger.info("成功获取锁: {}", lockKey);
            }
            
            List<Booking> conflictingBookings = bookingRepository.findConflictingBookings(
                request.getSeatId(),
                request.getDate(),
                timeSlot,
                BookingStatus.CONFIRMED
            );
            
            if (!conflictingBookings.isEmpty()) {
                logger.warn("检测到冲突预订: seatId={}, date={}, timeSlot={}",
                           request.getSeatId(), dateStr, timeSlot);
                throw new RuntimeException("该工位在此时段已被预订");
            }
            
            Seat seat = seatRepository.findById(request.getSeatId())
                .orElseThrow(() -> new RuntimeException("工位不存在"));
            
            if (request.getDate().isBefore(LocalDate.now())) {
                throw new RuntimeException("不能预订过去的日期");
            }
            
            Booking booking = new Booking();
            booking.setSeat(seat);
            booking.setUserId(request.getUserId());
            booking.setDate(request.getDate());
            booking.setTimeSlot(timeSlot);
            booking.setStatus(BookingStatus.CONFIRMED);
            
            Booking savedBooking = bookingRepository.save(booking);
            
            seatStatusCacheService.markAsBooked(seat.getSeatId(), request.getDate(), request.getTimeSlot().toUpperCase());
            
            logger.info("预订成功: bookingId={}, seatId={}, userId={}, date={}, timeSlot={}",
                       savedBooking.getBookingId(), request.getSeatId(), request.getUserId(),
                       dateStr, timeSlot);
            
            return savedBooking;
            
        } catch (InterruptedException e) {
            logger.error("获取锁被中断: seatId={}, date={}, timeSlot={}",
                        request.getSeatId(), dateStr, timeSlot);
            Thread.currentThread().interrupt();
            throw new RuntimeException("系统繁忙，请稍后重试");
        } finally {
            for (int i = acquiredLocks.size() - 1; i >= 0; i--) {
                try {
                    acquiredLocks.get(i).close();
                    logger.info("释放锁: {}", lockKeys.get(i));
                } catch (Exception e) {
                    logger.error("释放锁失败: {}", lockKeys.get(i), e);
                }
            }
        }
    }
    
    private List<String> getLockKeys(Long seatId, String dateStr, TimeSlot timeSlot) {
        List<String> keys = new ArrayList<>();
        
        if (timeSlot == TimeSlot.FULL_DAY) {
            keys.add(distributedLockService.getLockKey(seatId, dateStr, "MORNING"));
            keys.add(distributedLockService.getLockKey(seatId, dateStr, "AFTERNOON"));
        } else {
            keys.add(distributedLockService.getLockKey(seatId, dateStr, timeSlot.name()));
        }
        
        return keys;
    }
    
    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("预订不存在"));
        
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("预订已取消");
        }
        
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        
        seatStatusCacheService.markAsAvailable(
            booking.getSeatId(),
            booking.getDate(),
            booking.getTimeSlot().name()
        );
    }
    
    public List<Booking> getBookingsByDate(LocalDate date) {
        return bookingRepository.findByDateAndStatus(date, BookingStatus.CONFIRMED);
    }
    
    public List<Booking> getBookingsBySeatAndDate(Long seatId, LocalDate date) {
        return bookingRepository.findBySeat_SeatIdAndDateAndStatus(seatId, date, BookingStatus.CONFIRMED);
    }
    
    public List<Booking> getBookingsByUserAndDate(Long userId, LocalDate date) {
        return bookingRepository.findByUserIdAndDateAndStatus(userId, date, BookingStatus.CONFIRMED);
    }
    
    public Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId).orElse(null);
    }
}
