package com.zoo.monitoring.repository;

import com.zoo.monitoring.entity.MonitoringData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MonitoringDataRepository extends JpaRepository<MonitoringData, Long> {
    List<MonitoringData> findByBirdIdOrderByMonitorTimeDesc(Long birdId);

    List<MonitoringData> findByMonitorTimeBetweenOrderByMonitorTimeDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT AVG(m.wildBirdCount) FROM MonitoringData m WHERE m.monitorTime BETWEEN ?1 AND ?2")
    Double getAverageWildBirdCount(LocalDateTime start, LocalDateTime end);

    @Query("SELECT m FROM MonitoringData m WHERE m.monitorTime >= ?1 ORDER BY m.monitorTime DESC")
    List<MonitoringData> findRecentData(LocalDateTime since);
}
