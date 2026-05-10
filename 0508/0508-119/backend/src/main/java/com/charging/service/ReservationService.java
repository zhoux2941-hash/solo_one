package com.charging.service;

import com.charging.dto.ReservationRequest;
import com.charging.entity.ChargingPile;
import com.charging.entity.PileStatus;
import com.charging.entity.Reservation;
import com.charging.entity.ReservationStatus;
import com.charging.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationService {
    
    private final ReservationRepository reservationRepository;
    private final ChargingPileService chargingPileService;
    private final RedisCacheService redisCacheService;
    
    @Value("${app.reservation.max-future-hours:2}")
    private int maxFutureHours;
    
    @Value("${app.reservation.slot-minutes:30}")
    private int slotMinutes;
    
    @Value("${app.reservation.hold-minutes:15}")
    private int holdMinutes;
    
    private static final String RESERVATION_LOCK_PREFIX = "reservation:lock:";
    private static final List<ReservationStatus> ACTIVE_STATUSES = Arrays.asList(
            ReservationStatus.PENDING,
            ReservationStatus.ACTIVE
    );
    
    public List<LocalDateTime> getAvailableTimeSlots(Long pileId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime maxFuture = now.plusHours(maxFutureHours);
        
        LocalDateTime startOfFirstSlot = getNextSlotStart(now);
        List<LocalDateTime> availableSlots = new ArrayList<>();
        
        LocalDateTime current = startOfFirstSlot;
        while (current.isBefore(maxFuture)) {
            if (isSlotAvailable(pileId, current)) {
                availableSlots.add(current);
            }
            current = current.plusMinutes(slotMinutes);
        }
        
        return availableSlots;
    }
    
    private LocalDateTime getNextSlotStart(LocalDateTime time) {
        int minutes = time.getMinute();
        int remainder = minutes % slotMinutes;
        
        if (remainder == 0) {
            return time.truncatedTo(ChronoUnit.HOURS).plusMinutes(minutes);
        }
        
        int minutesToAdd = slotMinutes - remainder;
        return time.truncatedTo(ChronoUnit.HOURS).plusMinutes(minutes + minutesToAdd);
    }
    
    public boolean isSlotAvailable(Long pileId, LocalDateTime startTime) {
        LocalDateTime endTime = startTime.plusMinutes(slotMinutes);
        
        List<Reservation> overlapping = reservationRepository.findOverlappingReservations(
                pileId, startTime, endTime, ACTIVE_STATUSES);
        
        return overlapping.isEmpty();
    }
    
    @Transactional
    public Reservation createReservation(Long userId, ReservationRequest request) {
        ChargingPile pile = chargingPileService.getPileById(request.getPileId())
                .orElseThrow(() -> new RuntimeException("充电桩不存在"));
        
        if (pile.getStatus() != PileStatus.AVAILABLE) {
            throw new RuntimeException("充电桩当前不可用");
        }
        
        LocalDateTime startTime = request.getStartTime();
        if (startTime == null) {
            throw new RuntimeException("请选择预约时间");
        }
        
        validateReservationTime(startTime);
        
        if (!isSlotAvailable(request.getPileId(), startTime)) {
            throw new RuntimeException("该时间段已被预约");
        }
        
        String lockKey = RESERVATION_LOCK_PREFIX + request.getPileId() + ":" + startTime.toString();
        try {
            if (redisCacheService.hasKey(lockKey)) {
                throw new RuntimeException("该时间段正在被预约，请稍后重试");
            }
            redisCacheService.setValue(lockKey, true, 30, java.util.concurrent.TimeUnit.SECONDS);
            
            LocalDateTime endTime = startTime.plusMinutes(slotMinutes);
            LocalDateTime expiredAt = startTime.plusMinutes(holdMinutes);
            
            Reservation reservation = new Reservation();
            reservation.setUserId(userId);
            reservation.setPileId(request.getPileId());
            reservation.setStartTime(startTime);
            reservation.setEndTime(endTime);
            reservation.setStatus(ReservationStatus.PENDING);
            reservation.setExpiredAt(expiredAt);
            
            Reservation saved = reservationRepository.save(reservation);
            
            chargingPileService.updatePileStatus(request.getPileId(), PileStatus.OCCUPIED);
            
            log.info("Reservation created: userId={}, pileId={}, startTime={}", userId, request.getPileId(), startTime);
            
            return saved;
        } finally {
            redisCacheService.deleteKey(lockKey);
        }
    }
    
    private void validateReservationTime(LocalDateTime startTime) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime maxFuture = now.plusHours(maxFutureHours);
        
        if (startTime.isBefore(now)) {
            throw new RuntimeException("不能预约过去的时间");
        }
        
        if (startTime.isAfter(maxFuture)) {
            throw new RuntimeException("只能预约未来" + maxFutureHours + "小时内的时间");
        }
        
        if (startTime.getMinute() % slotMinutes != 0) {
            throw new RuntimeException("预约时间必须是" + slotMinutes + "分钟的倍数");
        }
    }
    
    @Transactional
    public Reservation useReservation(Long reservationId, Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        if (!reservation.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作此预约");
        }
        
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new RuntimeException("预约状态不正确");
        }
        
        if (LocalDateTime.now().isAfter(reservation.getExpiredAt())) {
            throw new RuntimeException("预约已过期");
        }
        
        reservation.setStatus(ReservationStatus.ACTIVE);
        reservation.setActualStartTime(LocalDateTime.now());
        
        return reservationRepository.save(reservation);
    }
    
    @Transactional
    public Reservation completeReservation(Long reservationId, Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        if (!reservation.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作此预约");
        }
        
        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new RuntimeException("预约状态不正确");
        }
        
        reservation.setStatus(ReservationStatus.COMPLETED);
        reservation.setActualEndTime(LocalDateTime.now());
        
        Reservation saved = reservationRepository.save(reservation);
        
        chargingPileService.updatePileStatus(reservation.getPileId(), PileStatus.AVAILABLE);
        
        return saved;
    }
    
    @Transactional
    public Reservation cancelReservation(Long reservationId, Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        if (!reservation.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作此预约");
        }
        
        if (reservation.getStatus() != ReservationStatus.PENDING && 
            reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new RuntimeException("预约状态不正确");
        }
        
        reservation.setStatus(ReservationStatus.CANCELLED);
        
        Reservation saved = reservationRepository.save(reservation);
        
        chargingPileService.updatePileStatus(reservation.getPileId(), PileStatus.AVAILABLE);
        
        return saved;
    }
    
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void releaseExpiredReservations() {
        log.info("Checking for expired reservations...");
        LocalDateTime now = LocalDateTime.now();
        
        // 场景1：PENDING状态，超过15分钟未使用（expiredAt < now）→ EXPIRED
        List<Reservation> expiredPending = reservationRepository
                .findByExpiredAtBeforeAndStatus(now, ReservationStatus.PENDING);
        
        for (Reservation reservation : expiredPending) {
            try {
                expireReservation(reservation, "超过15分钟未使用");
            } catch (Exception e) {
                log.error("Failed to release reservation: id={}", reservation.getId(), e);
            }
        }
        
        // 场景2：PENDING状态，预约时间段已结束（endTime < now）→ EXPIRED
        List<Reservation> pendingOutOfTime = reservationRepository
                .findByStatusAndEndTimeBefore(ReservationStatus.PENDING, now);
        
        for (Reservation reservation : pendingOutOfTime) {
            try {
                // 避免重复处理（场景1可能已经处理过）
                if (reservation.getStatus() == ReservationStatus.PENDING) {
                    expireReservation(reservation, "预约时间段已结束");
                }
            } catch (Exception e) {
                log.error("Failed to release out-of-time reservation: id={}", reservation.getId(), e);
            }
        }
        
        // 场景3：ACTIVE状态，充电时间已结束（endTime < now）→ COMPLETED（自动结束）
        List<Reservation> activeOutOfTime = reservationRepository
                .findByStatusAndEndTimeBefore(ReservationStatus.ACTIVE, now);
        
        for (Reservation reservation : activeOutOfTime) {
            try {
                autoCompleteReservation(reservation);
            } catch (Exception e) {
                log.error("Failed to auto-complete reservation: id={}", reservation.getId(), e);
            }
        }
    }
    
    private void expireReservation(Reservation reservation, String reason) {
        reservation.setStatus(ReservationStatus.EXPIRED);
        reservationRepository.save(reservation);
        
        chargingPileService.updatePileStatus(reservation.getPileId(), PileStatus.AVAILABLE);
        
        log.info("Reservation expired ({}): id={}, pileId={}, userId={}", 
                reason, reservation.getId(), reservation.getPileId(), reservation.getUserId());
    }
    
    private void autoCompleteReservation(Reservation reservation) {
        reservation.setStatus(ReservationStatus.COMPLETED);
        if (reservation.getActualEndTime() == null) {
            reservation.setActualEndTime(reservation.getEndTime());
        }
        reservationRepository.save(reservation);
        
        chargingPileService.updatePileStatus(reservation.getPileId(), PileStatus.AVAILABLE);
        
        log.info("Reservation auto-completed: id={}, pileId={}, userId={}", 
                reservation.getId(), reservation.getPileId(), reservation.getUserId());
    }
    
    public List<Reservation> getMyReservations(Long userId) {
        return reservationRepository.findByUserId(userId);
    }
    
    public Optional<Reservation> getReservationById(Long id) {
        return reservationRepository.findById(id);
    }
    
    public List<Reservation> getPileReservations(Long pileId) {
        return reservationRepository.findByPileId(pileId);
    }
}
