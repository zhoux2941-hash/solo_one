package com.museum.humidity.repository;

import com.museum.humidity.entity.HumidityRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HumidityRecordRepository extends JpaRepository<HumidityRecord, Long> {
    List<HumidityRecord> findByDeviceIdOrderByTimestampDesc(Long deviceId);
    List<HumidityRecord> findByDeviceIdAndTimestampBetweenOrderByTimestampAsc(Long deviceId, LocalDateTime start, LocalDateTime end);
    List<HumidityRecord> findTop20ByDeviceIdOrderByTimestampDesc(Long deviceId);
}
