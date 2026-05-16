package com.health.controller;

import com.health.entity.MedicalReport;
import com.health.entity.Reservation;
import com.health.service.MedicalReportService;
import com.health.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class MedicalReportController {

    @Autowired
    private MedicalReportService reportService;

    @Autowired
    private ReservationService reservationService;

    @PostMapping
    public ResponseEntity<MedicalReport> createReport(@RequestBody MedicalReport report) {
        return ResponseEntity.ok(reportService.createReport(report));
    }

    @GetMapping("/reservation/{reservationId}")
    public ResponseEntity<MedicalReport> getReportByReservationId(@PathVariable Long reservationId) {
        Optional<MedicalReport> report = reportService.getReportByReservationId(reservationId);
        return report.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/phone/{phone}")
    public ResponseEntity<List<MedicalReport>> getReportsByPhone(@PathVariable String phone) {
        return ResponseEntity.ok(reportService.getReportsByPhone(phone));
    }

    @GetMapping
    public ResponseEntity<List<MedicalReport>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalReport> getReportById(@PathVariable Long id) {
        MedicalReport report = reportService.getReportById(id);
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(report);
    }

    @PostMapping("/{id}/recheck")
    public ResponseEntity<String> requestRecheck(@PathVariable Long id) {
        MedicalReport report = reportService.getReportById(id);
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        
        String message = String.format(
            "【体检中心】尊敬的%s，您已成功申请报告复查，我们将尽快安排医生复核，结果将通过短信通知您。",
            report.getUserName()
        );
        System.out.println("发送复查申请通知: " + message);
        
        return ResponseEntity.ok("复查申请已提交");
    }
}
