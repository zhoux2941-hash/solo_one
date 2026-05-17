package com.office.platform.repository;

import com.office.platform.entity.SupplyRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplyRecordRepository extends JpaRepository<SupplyRecord, Long> {

    Page<SupplyRecord> findBySupplyIdOrderByCreateTimeDesc(Long supplyId, Pageable pageable);
}
