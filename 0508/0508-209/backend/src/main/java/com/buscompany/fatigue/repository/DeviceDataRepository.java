package com.buscompany.fatigue.repository;

import com.buscompany.fatigue.entity.DeviceData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DeviceDataRepository extends JpaRepository<DeviceData, Long> {
    List<DeviceData> findByDriverNoAndTimestampBetween(String driverNo, LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("SELECT d FROM DeviceData d WHERE d.driverNo = :driverNo AND d.timestamp >= :startTime ORDER BY d.timestamp DESC")
    List<DeviceData> findRecentData(@Param("driverNo") String driverNo, @Param("startTime") LocalDateTime startTime);
}
