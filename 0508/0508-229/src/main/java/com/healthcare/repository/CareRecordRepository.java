package com.healthcare.repository;

import com.healthcare.entity.CareRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CareRecordRepository extends JpaRepository<CareRecord, Long>, JpaSpecificationExecutor<CareRecord> {
    boolean existsByRecordNo(String recordNo);
    boolean existsByRecordNoAndIdNot(String recordNo, Long id);
    List<CareRecord> findByElderIdOrderByActualStartTimeDesc(Long elderId);
    List<CareRecord> findByCaregiverIdAndActualStartTimeBetween(Long caregiverId, LocalDateTime startTime, LocalDateTime endTime);
}
