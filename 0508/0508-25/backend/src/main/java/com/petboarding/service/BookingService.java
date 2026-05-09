package com.petboarding.service;

import com.petboarding.entity.*;
import com.petboarding.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final BookingLogRepository bookingLogRepository;
    private final RoomRepository roomRepository;
    private final PetRepository petRepository;
    private final OccupancyCacheService occupancyCacheService;
    private final DistributedLockService distributedLockService;
    
    private static final String LOCK_KEY_PREFIX = "booking:";
    
    @Transactional
    public Booking createBooking(Long petId, Long roomId, LocalDate startDate, LocalDate endDate, String specialRequirements) {
        validateDateRange(startDate, endDate);
        
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));
        
        if (!isPetSuitableForRoom(pet, room)) {
            throw new RuntimeException("Pet is not suitable for this room type");
        }
        
        String lockKey = buildLockKey(roomId, startDate, endDate);
        DistributedLockService.LockResult lock = distributedLockService.tryLock(lockKey, 5, 60, java.util.concurrent.TimeUnit.SECONDS);
        
        try {
            if (!lock.isAcquired()) {
                throw new RuntimeException("系统繁忙，请稍后重试（获取锁失败）");
            }
            
            OccupancyCacheService.AtomicReservationResult reservationResult = 
                    occupancyCacheService.tryReserveAtomically(roomId, startDate, endDate);
            
            if (!reservationResult.isSuccess()) {
                throw new RuntimeException("所选日期已被占用: " + reservationResult.getErrorMessage());
            }
            
            List<Booking> overlappingBookings = bookingRepository.findOverlappingBookings(
                    roomId, startDate, endDate);
            
            if (!overlappingBookings.isEmpty()) {
                occupancyCacheService.cancelReservationAtomically(roomId, startDate, endDate);
                throw new RuntimeException("房间在所选日期已存在有效预约");
            }
            
            long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
            BigDecimal totalPrice = room.getPricePerDay().multiply(BigDecimal.valueOf(days));
            
            Booking booking = Booking.builder()
                    .petId(petId)
                    .roomId(roomId)
                    .ownerId(pet.getOwnerId())
                    .startDate(startDate)
                    .endDate(endDate)
                    .status(Booking.BookingStatus.PENDING)
                    .totalPrice(totalPrice)
                    .specialRequirements(specialRequirements)
                    .build();
            
            booking = bookingRepository.save(booking);
            
            logBookingAction(booking, BookingLog.LogAction.CREATE, null);
            
            log.info("Booking created: bookingId={}, roomId={}, startDate={}, endDate={}",
                    booking.getBookingId(), roomId, startDate, endDate);
            
            return booking;
            
        } catch (RuntimeException e) {
            log.error("Failed to create booking: {}", e.getMessage(), e);
            throw e;
        } finally {
            distributedLockService.releaseLock(lock);
        }
    }
    
    @Transactional
    public Booking confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException("Only pending bookings can be confirmed");
        }
        
        String lockKey = buildLockKey(booking.getRoomId(), booking.getStartDate(), booking.getEndDate());
        DistributedLockService.LockResult lock = distributedLockService.tryLock(lockKey, 5, 60, java.util.concurrent.TimeUnit.SECONDS);
        
        try {
            if (!lock.isAcquired()) {
                throw new RuntimeException("系统繁忙，请稍后重试");
            }
            
            OccupancyCacheService.AtomicReservationResult reservationResult = 
                    occupancyCacheService.tryReserveAtomically(
                            booking.getRoomId(), 
                            booking.getStartDate(), 
                            booking.getEndDate()
                    );
            
            if (!reservationResult.isSuccess()) {
                booking.setStatus(Booking.BookingStatus.REJECTED);
                bookingRepository.save(booking);
                logBookingAction(booking, BookingLog.LogAction.REJECT, "确认时发现日期冲突: " + reservationResult.getErrorMessage());
                throw new RuntimeException("确认失败：所选日期已被其他预约占用");
            }
            
            booking.setStatus(Booking.BookingStatus.CONFIRMED);
            booking = bookingRepository.save(booking);
            
            logBookingAction(booking, BookingLog.LogAction.UPDATE, "Booking confirmed");
            
            log.info("Booking confirmed: bookingId={}", bookingId);
            
            return booking;
            
        } finally {
            distributedLockService.releaseLock(lock);
        }
    }
    
    @Transactional
    public Booking cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED || 
            booking.getStatus() == Booking.BookingStatus.REJECTED) {
            throw new RuntimeException("Booking is already cancelled or rejected");
        }
        
        String lockKey = buildLockKey(booking.getRoomId(), booking.getStartDate(), booking.getEndDate());
        DistributedLockService.LockResult lock = distributedLockService.tryLock(lockKey, 5, 60, java.util.concurrent.TimeUnit.SECONDS);
        
        try {
            if (!lock.isAcquired()) {
                throw new RuntimeException("系统繁忙，请稍后重试");
            }
            
            Booking.BookingStatus oldStatus = booking.getStatus();
            booking.setStatus(Booking.BookingStatus.CANCELLED);
            booking = bookingRepository.save(booking);
            
            if (oldStatus == Booking.BookingStatus.CONFIRMED) {
                occupancyCacheService.cancelReservationAtomically(
                        booking.getRoomId(), 
                        booking.getStartDate(), 
                        booking.getEndDate()
                );
            }
            
            logBookingAction(booking, BookingLog.LogAction.CANCEL, null);
            
            log.info("Booking cancelled: bookingId={}", bookingId);
            
            return booking;
            
        } finally {
            distributedLockService.releaseLock(lock);
        }
    }
    
    @Transactional
    public Booking rejectBooking(Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException("Only pending bookings can be rejected");
        }
        
        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking = bookingRepository.save(booking);
        
        logBookingAction(booking, BookingLog.LogAction.REJECT, reason);
        
        log.info("Booking rejected: bookingId={}, reason={}", bookingId, reason);
        
        return booking;
    }
    
    public boolean isRoomAvailable(Long roomId, LocalDate startDate, LocalDate endDate) {
        if (!occupancyCacheService.isAvailable(roomId, startDate, endDate)) {
            return false;
        }
        
        List<Booking> overlappingBookings = bookingRepository.findOverlappingBookings(
                roomId, startDate, endDate);
        
        if (!overlappingBookings.isEmpty()) {
            occupancyCacheService.markOccupied(roomId, startDate, endDate);
            return false;
        }
        
        return true;
    }
    
    public AvailabilityCheckResult checkRoomAvailabilityWithDetails(Long roomId, LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        
        List<LocalDate> conflictingDates = new java.util.ArrayList<>();
        
        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {
            if (occupancyCacheService.isOccupied(roomId, date)) {
                conflictingDates.add(date);
            }
            date = date.plusDays(1);
        }
        
        if (!conflictingDates.isEmpty()) {
            return new AvailabilityCheckResult(false, conflictingDates, "Redis缓存显示冲突");
        }
        
        List<Booking> overlappingBookings = bookingRepository.findOverlappingBookings(
                roomId, startDate, endDate);
        
        if (!overlappingBookings.isEmpty()) {
            occupancyCacheService.markOccupied(roomId, startDate, endDate);
            
            date = startDate;
            while (!date.isAfter(endDate)) {
                conflictingDates.add(date);
                date = date.plusDays(1);
            }
            return new AvailabilityCheckResult(false, conflictingDates, "数据库存在有效预约");
        }
        
        return new AvailabilityCheckResult(true, java.util.Collections.emptyList(), null);
    }
    
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("日期不能为空");
        }
        
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("入住日期必须早于离开日期");
        }
        
        if (startDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("入住日期不能早于今天");
        }
        
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (days > 90) {
            throw new IllegalArgumentException("预约时长不能超过90天");
        }
    }
    
    private String buildLockKey(Long roomId, LocalDate startDate, LocalDate endDate) {
        return LOCK_KEY_PREFIX + roomId + ":" + startDate + ":" + endDate;
    }
    
    private boolean isPetSuitableForRoom(Pet pet, Room room) {
        String suitableFor = room.getSuitableForPetType();
        if (suitableFor != null && !suitableFor.isEmpty()) {
            if (!suitableFor.contains(pet.getType().name())) {
                return false;
            }
        }
        
        if (room.getMaxSize() != null) {
            int petSizeOrder = getSizeOrder(pet.getSize());
            int roomMaxSizeOrder = getSizeOrder(room.getMaxSize());
            if (petSizeOrder > roomMaxSizeOrder) {
                return false;
            }
        }
        
        return true;
    }
    
    private int getSizeOrder(Pet.PetSize size) {
        return switch (size) {
            case SMALL -> 1;
            case MEDIUM -> 2;
            case LARGE -> 3;
        };
    }
    
    private void logBookingAction(Booking booking, BookingLog.LogAction action, String reason) {
        BookingLog log = BookingLog.builder()
                .bookingId(booking.getBookingId())
                .petId(booking.getPetId())
                .roomId(booking.getRoomId())
                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .action(action)
                .reason(reason)
                .build();
        bookingLogRepository.save(log);
    }
    
    public List<Booking> getBookingsByOwner(Long ownerId) {
        return bookingRepository.findByOwnerId(ownerId);
    }
    
    public List<Booking> getBookingsByPet(Long petId) {
        return bookingRepository.findByPetId(petId);
    }
    
    public Optional<Booking> getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId);
    }
    
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class AvailabilityCheckResult {
        private final boolean available;
        private final List<LocalDate> conflictingDates;
        private final String reason;
    }
}
