package com.kindergarten.temperature.repository;

import com.kindergarten.temperature.entity.TemperatureRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TemperatureRecordRepository extends JpaRepository<TemperatureRecord, Long> {

    List<TemperatureRecord> findByBedNoOrderByRecordTimeDesc(Integer bedNo);

    List<TemperatureRecord> findByBedNoAndRecordTimeBetweenOrderByRecordTimeDesc(
            Integer bedNo, LocalDateTime startTime, LocalDateTime endTime);

    List<TemperatureRecord> findByRecordTimeBetweenOrderByRecordTimeDesc(
            LocalDateTime startTime, LocalDateTime endTime);

    List<TemperatureRecord> findByAbnormalTrueOrderByRecordTimeDesc();

    @Query("SELECT t FROM TemperatureRecord t WHERE t.bedNo = :bedNo ORDER BY t.recordTime DESC")
    List<TemperatureRecord> findLatestByBedNo(@Param("bedNo") Integer bedNo, org.springframework.data.domain.Pageable pageable);
}
