package com.industrial.workorder.repository;

import com.industrial.workorder.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByUserId(Long userId);
    List<Schedule> findByScheduleDate(LocalDate scheduleDate);
    List<Schedule> findByScheduleDateBetween(LocalDate startDate, LocalDate endDate);
    List<Schedule> findByUserIdAndScheduleDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}
