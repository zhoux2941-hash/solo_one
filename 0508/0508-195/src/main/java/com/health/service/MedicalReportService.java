package com.health.service;

import com.health.entity.HealthIndicator;
import com.health.entity.MedicalReport;
import com.health.entity.Reservation;
import com.health.repository.MedicalReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MedicalReportService {

    @Autowired
    private MedicalReportRepository reportRepository;

    @Autowired
    private ReservationService reservationService;

    public MedicalReport createReport(MedicalReport report) {
        report.setCreatedAt(LocalDateTime.now());
        
        boolean hasAbnormal = false;
        for (HealthIndicator indicator : report.getIndicators()) {
            if (indicator.getIsAbnormal() != null && indicator.getIsAbnormal()) {
                hasAbnormal = true;
                break;
            }
        }
        report.setHasAbnormal(hasAbnormal);
        
        MedicalReport savedReport = reportRepository.save(report);
        reservationService.markReportUploaded(report.getReservationId());
        return savedReport;
    }

    public Optional<MedicalReport> getReportByReservationId(Long reservationId) {
        return reportRepository.findByReservationId(reservationId);
    }

    public List<MedicalReport> getReportsByPhone(String phone) {
        return reportRepository.findByPhoneOrderByCreatedAtDesc(phone);
    }

    public List<MedicalReport> getAllReports() {
        return reportRepository.findAll();
    }

    public MedicalReport getReportById(Long id) {
        return reportRepository.findById(id).orElse(null);
    }
}
