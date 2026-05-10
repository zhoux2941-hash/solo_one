package com.festival.volunteer.repository;

import com.festival.volunteer.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByVolunteerId(Long volunteerId);
    List<Schedule> findByPositionId(Long positionId);
    List<Schedule> findByScheduleDate(String scheduleDate);
    List<Schedule> findByVolunteerIdAndScheduleDate(Long volunteerId, String scheduleDate);
    List<Schedule> findByStatus(Schedule.ScheduleStatus status);
    
    @Query("SELECT s FROM Schedule s WHERE s.scheduleDate = :date AND s.status = :status")
    List<Schedule> findByDateAndStatus(String date, Schedule.ScheduleStatus status);
    
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.position.id = :positionId AND s.status = :status")
    long countByPositionIdAndStatus(Long positionId, Schedule.ScheduleStatus status);
}
