package com.museum.humidity.repository;

import com.museum.humidity.entity.ControlLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ControlLogRepository extends JpaRepository<ControlLog, Long> {
    List<ControlLog> findByDeviceIdOrderByTimestampDesc(Long deviceId);
    List<ControlLog> findTop10ByDeviceIdOrderByTimestampDesc(Long deviceId);
    List<ControlLog> findByDeviceIdAndTimestampBetweenOrderByTimestampAsc(Long deviceId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(c.energyConsumption), 0) FROM ControlLog c WHERE c.deviceId = :deviceId AND c.timestamp BETWEEN :start AND :end AND c.controlType = 'HUMIDIFY'")
    Double sumHumidifyEnergyByDeviceIdAndTimeRange(@Param("deviceId") Long deviceId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(c.energyConsumption), 0) FROM ControlLog c WHERE c.deviceId = :deviceId AND c.timestamp BETWEEN :start AND :end AND c.controlType = 'DEHUMIDIFY'")
    Double sumDehumidifyEnergyByDeviceIdAndTimeRange(@Param("deviceId") Long deviceId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
