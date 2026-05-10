package com.beekeeper.repository;

import com.beekeeper.entity.TemperatureRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TemperatureRecordRepository extends JpaRepository<TemperatureRecord, Long> {
    Optional<TemperatureRecord> findByRecordDate(LocalDate recordDate);
    
    @Query("SELECT t FROM TemperatureRecord t WHERE t.recordDate BETWEEN :startDate AND :endDate ORDER BY t.recordDate ASC")
    List<TemperatureRecord> findByRecordDateBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    boolean existsByRecordDate(LocalDate recordDate);
}
