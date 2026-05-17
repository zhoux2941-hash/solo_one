package com.healthcare.repository;

import com.healthcare.entity.HealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long>, JpaSpecificationExecutor<HealthRecord> {
    boolean existsByRecordNo(String recordNo);
    boolean existsByRecordNoAndIdNot(String recordNo, Long id);
    List<HealthRecord> findByElderIdOrderByRecordDateDesc(Long elderId);
}
