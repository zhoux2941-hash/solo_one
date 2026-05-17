package com.zoo.monitoring.repository;

import com.zoo.monitoring.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByBirdIdOrderByAlertTimeDesc(Long birdId);

    List<Alert> findByIsHandledFalseOrderByAlertTimeDesc();

    List<Alert> findByAlertLevelOrderByAlertTimeDesc(String alertLevel);

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.alertTime BETWEEN ?1 AND ?2")
    Long countByTimeRange(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.alertLevel = ?1 AND a.alertTime BETWEEN ?2 AND ?3")
    Long countByAlertLevelAndTimeRange(String alertLevel, LocalDateTime start, LocalDateTime end);

    @Query("SELECT a.alertType, COUNT(a) FROM Alert a WHERE a.alertTime BETWEEN ?1 AND ?2 GROUP BY a.alertType")
    List<Object[]> countByAlertType(LocalDateTime start, LocalDateTime end);
}
