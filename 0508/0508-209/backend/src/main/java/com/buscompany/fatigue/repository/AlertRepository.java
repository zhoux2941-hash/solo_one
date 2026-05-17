package com.buscompany.fatigue.repository;

import com.buscompany.fatigue.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByHandledFalseOrderByAlertTimeDesc();
    List<Alert> findByDriverNoOrderByAlertTimeDesc(String driverNo);
    
    @Query("SELECT a.driverNo, a.driverName, COUNT(a) as alertCount FROM Alert a " +
           "WHERE a.alertTime BETWEEN :startTime AND :endTime " +
           "GROUP BY a.driverNo, a.driverName ORDER BY alertCount DESC")
    List<Object[]> findAlertRanking(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT FUNCTION('HOUR', a.alertTime) as hour, COUNT(a) as count FROM Alert a " +
           "WHERE a.alertTime BETWEEN :startTime AND :endTime " +
           "GROUP BY FUNCTION('HOUR', a.alertTime) ORDER BY hour")
    List<Object[]> findAlertByHour(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
}
