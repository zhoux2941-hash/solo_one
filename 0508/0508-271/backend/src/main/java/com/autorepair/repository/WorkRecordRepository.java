package com.autorepair.repository;

import com.autorepair.entity.WorkRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkRecordRepository extends JpaRepository<WorkRecord, Long> {
    List<WorkRecord> findByWorkOrderIdOrderByOperateTimeDesc(Long workOrderId);
}