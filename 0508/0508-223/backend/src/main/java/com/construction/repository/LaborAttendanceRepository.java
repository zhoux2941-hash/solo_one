package com.construction.repository;

import com.construction.entity.LaborAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LaborAttendanceRepository extends JpaRepository<LaborAttendance, Long>, JpaSpecificationExecutor<LaborAttendance> {

    Optional<LaborAttendance> findByWorkerIdAndAttendanceDate(Long workerId, LocalDate attendanceDate);

    List<LaborAttendance> findByWorkerIdAndAttendanceDateBetween(Long workerId, LocalDate startDate, LocalDate endDate);

    List<LaborAttendance> findByProjectIdAndAttendanceDateBetween(Long projectId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COUNT(DISTINCT a.attendanceDate) FROM LaborAttendance a WHERE a.workerId = ?1 AND a.attendanceDate BETWEEN ?2 AND ?3 AND a.workHours > 0")
    Integer countAttendanceDays(Long workerId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(a.workHours), 0) FROM LaborAttendance a WHERE a.workerId = ?1 AND a.attendanceDate BETWEEN ?2 AND ?3")
    java.math.BigDecimal sumWorkHours(Long workerId, LocalDate startDate, LocalDate endDate);
}
