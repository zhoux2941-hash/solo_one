package com.pet.hospital.repository;

import com.pet.hospital.entity.VaccineScrapRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccineScrapRecordRepository extends JpaRepository<VaccineScrapRecord, Long> {

    List<VaccineScrapRecord> findAllByOrderByScrappedAtDesc();

    List<VaccineScrapRecord> findByVaccineNameContainingIgnoreCaseOrderByScrappedAtDesc(String vaccineName);
}
