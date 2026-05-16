package com.hrbonus.controller;

import com.hrbonus.entity.BonusReport;
import com.hrbonus.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<BonusReport>> getByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(reportService.getDepartmentReports(departmentId));
    }

    @GetMapping("/department/{departmentId}/quarter")
    public ResponseEntity<BonusReport> getByQuarter(
            @PathVariable Long departmentId,
            @RequestParam Integer year,
            @RequestParam Integer quarter) {
        return ResponseEntity.ok(reportService.getReportByQuarter(departmentId, year, quarter));
    }
}
