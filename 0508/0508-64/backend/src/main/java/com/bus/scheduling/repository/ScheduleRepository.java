package com.bus.scheduling.repository;

import com.bus.scheduling.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByScheduleDateOrderByDriverIdAscTimeSlotStartAsc(LocalDate scheduleDate);
    List<Schedule> findByDriverIdAndScheduleDateOrderByTimeSlotStartAsc(Long driverId, LocalDate scheduleDate);
    void deleteByScheduleDate(LocalDate scheduleDate);
}
