package com.hrbonus.service;

import com.hrbonus.entity.*;
import com.hrbonus.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    @Autowired
    private BonusReportRepository reportRepository;

    @Autowired
    private BonusPoolRepository bonusPoolRepository;

    @Autowired
    private BonusAllocationRepository allocationRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Scheduled(cron = "0 0 0 1 1,4,7,10 ?")
    @Transactional
    public void autoArchiveAndGenerateReports() {
        LocalDateTime now = LocalDateTime.now();
        int quarter = (now.getMonthValue() - 1) / 3 + 1;
        int year = now.getYear();

        int prevQuarter = quarter == 1 ? 4 : quarter - 1;
        int prevYear = quarter == 1 ? year - 1 : year;

        List<BonusPool> pools = bonusPoolRepository.findByIsArchived(false);

        for (BonusPool pool : pools) {
            if (pool.getQuarterYear() < prevYear ||
                (pool.getQuarterYear().equals(prevYear) && pool.getQuarterNumber() < prevQuarter)) {
                pool.setIsArchived(true);
                pool.setStatus(BonusPool.PoolStatus.ARCHIVED);
                bonusPoolRepository.save(pool);
                generateReport(pool);
            }
        }
    }

    @Transactional
    public BonusReport generateReport(BonusPool pool) {
        Department dept = departmentRepository.findById(pool.getDepartmentId())
                .orElse(null);

        List<BonusAllocation> allocations = allocationRepository.findByBonusPoolId(pool.getId());

        BigDecimal totalBonus = allocations.stream()
                .map(BonusAllocation::getAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int employeeCount = allocations.size();
        BigDecimal avgBonus = employeeCount > 0
                ? totalBonus.divide(new BigDecimal(employeeCount), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> reportData = new HashMap<>();
        reportData.put("allocations", allocations);
        reportData.put("totalBonus", totalBonus);
        reportData.put("employeeCount", employeeCount);

        BonusReport report = new BonusReport();
        report.setDepartmentId(pool.getDepartmentId());
        report.setDepartmentName(dept != null ? dept.getName() : "未知");
        report.setQuarterYear(pool.getQuarterYear());
        report.setQuarterNumber(pool.getQuarterNumber());
        report.setTotalBonus(totalBonus);
        report.setEmployeeCount(employeeCount);
        report.setAvgBonus(avgBonus);

        try {
            report.setReportData(objectMapper.writeValueAsString(reportData));
        } catch (Exception e) {
            report.setReportData("{}");
        }

        return reportRepository.save(report);
    }

    public List<BonusReport> getDepartmentReports(Long departmentId) {
        return reportRepository.findByDepartmentId(departmentId);
    }

    public BonusReport getReportByQuarter(Long departmentId, Integer year, Integer quarter) {
        return reportRepository.findByDepartmentIdAndQuarterYearAndQuarterNumber(departmentId, year, quarter)
                .orElse(null);
    }
}
