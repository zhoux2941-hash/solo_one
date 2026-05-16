package com.cinema.service;

import com.cinema.entity.Seat;
import com.cinema.repository.SeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SeatService {
    
    @Autowired
    private SeatRepository seatRepository;
    
    public List<Seat> getSeatsBySchedule(Long scheduleId) {
        return seatRepository.findByScheduleId(scheduleId);
    }
    
    @Transactional
    public boolean lockSeats(List<Long> seatIds, Long memberId, int minutes) {
        LocalDateTime lockUntil = LocalDateTime.now().plusMinutes(minutes);
        for (Long seatId : seatIds) {
            Seat seat = seatRepository.findById(seatId).orElse(null);
            if (seat == null || seat.getStatus() != Seat.SeatStatus.AVAILABLE) {
                return false;
            }
            seat.setStatus(Seat.SeatStatus.LOCKED);
            seat.setLockedBy(memberId);
            seat.setLockedUntil(lockUntil);
            seatRepository.save(seat);
        }
        return true;
    }
    
    @Transactional
    public void releaseSeats(List<Long> seatIds) {
        for (Long seatId : seatIds) {
            Seat seat = seatRepository.findById(seatId).orElse(null);
            if (seat != null && seat.getStatus() == Seat.SeatStatus.LOCKED) {
                seat.setStatus(Seat.SeatStatus.AVAILABLE);
                seat.setLockedBy(null);
                seat.setLockedUntil(null);
                seatRepository.save(seat);
            }
        }
    }
    
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void releaseExpiredLocks() {
        List<Seat> expiredSeats = seatRepository.findExpiredLockedSeats(LocalDateTime.now());
        for (Seat seat : expiredSeats) {
            seat.setStatus(Seat.SeatStatus.AVAILABLE);
            seat.setLockedBy(null);
            seat.setLockedUntil(null);
            seatRepository.save(seat);
        }
    }
    
    @Transactional
    public void occupySeats(List<Long> seatIds) {
        for (Long seatId : seatIds) {
            Seat seat = seatRepository.findById(seatId).orElse(null);
            if (seat != null) {
                seat.setStatus(Seat.SeatStatus.OCCUPIED);
                seat.setLockedBy(null);
                seat.setLockedUntil(null);
                seatRepository.save(seat);
            }
        }
    }
}