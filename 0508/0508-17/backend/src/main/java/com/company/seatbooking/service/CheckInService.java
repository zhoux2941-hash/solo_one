package com.company.seatbooking.service;

import com.company.seatbooking.entity.Booking;
import com.company.seatbooking.entity.Booking.BookingStatus;
import com.company.seatbooking.entity.Booking.TimeSlot;
import com.company.seatbooking.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class CheckInService {
    
    private static final Logger logger = LoggerFactory.getLogger(CheckInService.class);
    
    private static final int CHECK_IN_GRACE_MINUTES = 30;
    
    private static final LocalTime MORNING_START = LocalTime.of(9, 0);
    private static final LocalTime AFTERNOON_START = LocalTime.of(14, 0);
    
    private final BookingRepository bookingRepository;
    private final SeatStatusCacheService seatStatusCacheService;
    
    public CheckInService(BookingRepository bookingRepository,
                          SeatStatusCacheService seatStatusCacheService) {
        this.bookingRepository = bookingRepository;
        this.seatStatusCacheService = seatStatusCacheService;
    }
    
    @Transactional
    public Booking checkIn(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("预订不存在"));
        
        if (!booking.canCheckIn()) {
            if (booking.getStatus() == BookingStatus.CHECKED_IN) {
                throw new RuntimeException("您已签到");
            } else if (booking.getStatus() == BookingStatus.AUTO_RELEASED) {
                throw new RuntimeException("该预订已自动释放");
            } else {
                throw new RuntimeException("当前状态无法签到");
            }
        }
        
        if (!booking.getDate().equals(LocalDate.now())) {
            throw new RuntimeException("只能在预订当天签到");
        }
        
        if (!isWithinCheckInTime(booking)) {
            throw new RuntimeException("当前时段不在签到时间范围内");
        }
        
        booking.setCheckInTime(LocalDateTime.now());
        booking.setStatus(BookingStatus.CHECKED_IN);
        
        Booking saved = bookingRepository.save(booking);
        logger.info("用户 {} 签到成功: bookingId={}, seatId={}, timeSlot={}",
                   booking.getUserId(), bookingId, booking.getSeatId(), booking.getTimeSlot());
        
        return saved;
    }
    
    @Transactional
    public Booking simulateAccessCardCheckIn(Long userId, Long seatId) {
        LocalDate today = LocalDate.now();
        List<Booking> activeBookings = bookingRepository.findUserActiveBookings(userId, today);
        
        if (activeBookings.isEmpty()) {
            throw new RuntimeException("您今天没有有效的预订");
        }
        
        Booking matchingBooking = activeBookings.stream()
            .filter(b -> b.getSeatId().equals(seatId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("您没有预订该工位"));
        
        return checkIn(matchingBooking.getBookingId());
    }
    
    private boolean isWithinCheckInTime(Booking booking) {
        LocalTime now = LocalTime.now();
        TimeSlot timeSlot = booking.getTimeSlot();
        
        if (timeSlot == TimeSlot.MORNING) {
            LocalTime graceEnd = MORNING_START.plusMinutes(CHECK_IN_GRACE_MINUTES);
            return !now.isBefore(MORNING_START.minusMinutes(30)) && !now.isAfter(graceEnd);
        } else if (timeSlot == TimeSlot.AFTERNOON) {
            LocalTime graceEnd = AFTERNOON_START.plusMinutes(CHECK_IN_GRACE_MINUTES);
            return !now.isBefore(AFTERNOON_START.minusMinutes(30)) && !now.isAfter(graceEnd);
        } else {
            LocalTime morningGraceEnd = MORNING_START.plusMinutes(CHECK_IN_GRACE_MINUTES);
            LocalTime afternoonGraceEnd = AFTERNOON_START.plusMinutes(CHECK_IN_GRACE_MINUTES);
            return (!now.isBefore(MORNING_START.minusMinutes(30)) && !now.isAfter(morningGraceEnd)) ||
                   (!now.isBefore(AFTERNOON_START.minusMinutes(30)) && !now.isAfter(afternoonGraceEnd));
        }
    }
    
    public boolean isOverdueForCheckIn(Booking booking) {
        if (booking.getCheckInTime() != null || booking.getStatus() != BookingStatus.CONFIRMED) {
            return false;
        }
        
        LocalDate today = LocalDate.now();
        if (!booking.getDate().equals(today)) {
            return false;
        }
        
        LocalTime now = LocalTime.now();
        TimeSlot timeSlot = booking.getTimeSlot();
        
        if (timeSlot == TimeSlot.MORNING || timeSlot == TimeSlot.FULL_DAY) {
            LocalTime graceEnd = MORNING_START.plusMinutes(CHECK_IN_GRACE_MINUTES);
            if (now.isAfter(graceEnd)) {
                return true;
            }
        }
        
        if (timeSlot == TimeSlot.AFTERNOON || timeSlot == TimeSlot.FULL_DAY) {
            LocalTime graceEnd = AFTERNOON_START.plusMinutes(CHECK_IN_GRACE_MINUTES);
            if (now.isAfter(graceEnd)) {
                return true;
            }
        }
        
        return false;
    }
    
    @Transactional
    public Booking autoReleaseBooking(Booking booking) {
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            return booking;
        }
        
        booking.setStatus(BookingStatus.AUTO_RELEASED);
        booking.setIsAutoReleased(true);
        booking.setReleasedAt(LocalDateTime.now());
        
        Booking saved = bookingRepository.save(booking);
        
        seatStatusCacheService.markAsAvailable(
            booking.getSeatId(),
            booking.getDate(),
            booking.getTimeSlot().name()
        );
        
        logger.warn("自动释放预订: bookingId={}, userId={}, seatId={}, date={}, timeSlot={}",
                   booking.getBookingId(), booking.getUserId(), booking.getSeatId(),
                   booking.getDate(), booking.getTimeSlot());
        
        return saved;
    }
    
    public List<Booking> getTodayUncheckedInBookings() {
        return bookingRepository.findTodayUncheckedInBookings(LocalDate.now());
    }
    
    public List<Booking> getUserConfirmedBookings(Long userId) {
        return bookingRepository.findConfirmedBookingsByUserId(userId);
    }
}
