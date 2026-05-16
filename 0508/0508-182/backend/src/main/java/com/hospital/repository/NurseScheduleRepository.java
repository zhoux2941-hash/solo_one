package com.hospital.repository;

import com.hospital.entity.NurseSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface NurseScheduleRepository extends JpaRepository<NurseSchedule, Long> {
    List<NurseSchedule> findByScheduleDateBetween(LocalDate startDate, LocalDate endDate);
    List<NurseSchedule> findByNurseIdAndScheduleDateBetween(Long nurseId, LocalDate startDate, LocalDate endDate);
    List<NurseSchedule> findByScheduleDate(LocalDate date);
    
    @Query("SELECT COUNT(ns) FROM NurseSchedule ns WHERE ns.nurse.id = :nurseId " +
           "AND ns.scheduleDate BETWEEN :startOfWeek AND :endOfWeek")
    long countSchedulesInWeek(@Param("nurseId") Long nurseId, 
                              @Param("startOfWeek") LocalDate startOfWeek, 
                              @Param("endOfWeek") LocalDate endOfWeek);

    @Query("SELECT COUNT(DISTINCT ns.nurse) FROM NurseSchedule ns " +
           "WHERE ns.scheduleDate = :date AND ns.nurse.isIcuQualified = true " +
           "AND ns.status IN ('CONFIRMED', 'APPROVED')")
    long countIcuNursesOnDate(@Param("date") LocalDate date);
}
