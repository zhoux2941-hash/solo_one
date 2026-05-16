package com.cinema.repository;

import com.cinema.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByScheduleId(Long scheduleId);
    
    @Query("SELECT s FROM Seat s WHERE s.status = 'LOCKED' AND s.lockedUntil < :now")
    List<Seat> findExpiredLockedSeats(LocalDateTime now);
}