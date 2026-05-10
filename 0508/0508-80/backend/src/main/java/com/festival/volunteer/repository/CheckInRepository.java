package com.festival.volunteer.repository;

import com.festival.volunteer.entity.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, Long> {
    Optional<CheckIn> findByScheduleId(Long scheduleId);
    List<CheckIn> findByVolunteerId(Long volunteerId);
    List<CheckIn> findByPositionId(Long positionId);
    boolean existsByScheduleId(Long scheduleId);
    
    @Query("SELECT COUNT(c) FROM CheckIn c WHERE c.position.id = :positionId")
    long countByPositionId(Long positionId);
    
    @Query("SELECT c FROM CheckIn c WHERE c.checkInTime BETWEEN :start AND :end")
    List<CheckIn> findByCheckInTimeBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT COUNT(c) FROM CheckIn c WHERE c.position.id = :positionId AND c.checkInTime BETWEEN :start AND :end")
    long countByPositionIdAndCheckInTimeBetween(Long positionId, LocalDateTime start, LocalDateTime end);
}
