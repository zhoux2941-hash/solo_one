package com.mineral.identification.repository;

import com.mineral.identification.entity.IdentificationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IdentificationRecordRepository extends JpaRepository<IdentificationRecord, Long> {
}
