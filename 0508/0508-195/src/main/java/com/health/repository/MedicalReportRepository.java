package com.health.repository;

import com.health.entity.MedicalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    Optional<MedicalReport> findByReservationId(Long reservationId);
    List<MedicalReport> findByPhoneOrderByCreatedAtDesc(String phone);
}
