package com.campsite.repository;

import com.campsite.entity.UsageRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsageRecordRepository extends JpaRepository<UsageRecord, Long> {

    List<UsageRecord> findByRecordType(String recordType);

    List<UsageRecord> findByAreaId(Long areaId);

    List<UsageRecord> findByMaintenanceStatus(String maintenanceStatus);

    Page<UsageRecord> findAll(Pageable pageable);

    Page<UsageRecord> findByRecordType(String recordType, Pageable pageable);

    Page<UsageRecord> findByMaintenanceStatus(String maintenanceStatus, Pageable pageable);
}
