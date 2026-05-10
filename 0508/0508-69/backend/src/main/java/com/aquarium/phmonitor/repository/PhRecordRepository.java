package com.aquarium.phmonitor.repository;

import com.aquarium.phmonitor.entity.PhRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PhRecordRepository extends JpaRepository<PhRecord, Long> {

    List<PhRecord> findByTankNameOrderByRecordTimeAsc(String tankName);

    List<PhRecord> findByTankNameAndRecordTimeBetweenOrderByRecordTimeAsc(
        String tankName,
        LocalDateTime startTime,
        LocalDateTime endTime
    );

    List<PhRecord> findByRecordTimeBetweenOrderByTankNameAscRecordTimeAsc(
        LocalDateTime startTime,
        LocalDateTime endTime
    );

    @Query("SELECT p FROM PhRecord p WHERE p.tankName = :tankName ORDER BY p.recordTime DESC")
    List<PhRecord> findLatestByTankName(@Param("tankName") String tankName);

    long count();
}
