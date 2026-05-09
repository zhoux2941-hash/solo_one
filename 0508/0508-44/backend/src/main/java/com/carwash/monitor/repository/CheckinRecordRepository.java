package com.carwash.monitor.repository;

import com.carwash.monitor.entity.CheckinRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CheckinRecordRepository extends JpaRepository<CheckinRecord, Long> {
    Optional<CheckinRecord> findByEmployeeIdAndCheckinDate(Long employeeId, LocalDate checkinDate);
    
    List<CheckinRecord> findByEmployeeIdOrderByCheckinDateDesc(Long employeeId);
    
    @Query("SELECT cr FROM CheckinRecord cr WHERE cr.employeeId = :employeeId AND cr.checkinDate < :date ORDER BY cr.checkinDate DESC")
    List<CheckinRecord> findPreviousRecords(Long employeeId, LocalDate date);
    
    @Query("SELECT cr FROM CheckinRecord cr WHERE cr.checkinDate BETWEEN :startDate AND :endDate AND cr.isSuccess = true")
    List<CheckinRecord> findWeeklySuccessfulCheckins(LocalDate startDate, LocalDate endDate);
}
