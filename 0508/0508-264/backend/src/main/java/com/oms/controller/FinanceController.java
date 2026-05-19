package com.oms.controller;

import com.oms.entity.FinanceReport;
import com.oms.repository.FinanceReportRepository;
import com.oms.service.FinanceExportService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/finance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FinanceController {

    private final FinanceExportService financeExportService;
    private final FinanceReportRepository financeReportRepository;

    private static final long LARGE_DATA_WARNING_THRESHOLD = 50000; // 超过5万行警告
    private static final long RECOMMEND_CSV_THRESHOLD = 100000; // 超过10万行推荐用CSV

    /**
     * 分页查询财务报表数据
     */
    @GetMapping("/reports")
    public ResponseEntity<Page<FinanceReport>> getReports(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long tenantId = com.oms.config.TenantContext.getTenantId();
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("reportDate").descending());
        Page<FinanceReport> reports = financeReportRepository.findByTenantIdAndReportDateBetween(tenantId, startDate, endDate, pageRequest);
        return ResponseEntity.ok(reports);
    }

    /**
     * 导出前预估数据量，用于前端警告提示
     */
    @GetMapping("/export/estimate")
    public ResponseEntity<Map<String, Object>> estimateExportCount(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        long count = financeExportService.estimateExportCount(startDate, endDate);

        Map<String, Object> result = new HashMap<>();
        result.put("count", count);
        result.put("isLargeData", count > LARGE_DATA_WARNING_THRESHOLD);
        result.put("recommendCsv", count > RECOMMEND_CSV_THRESHOLD);
        result.put("estimatedExcelSizeMb", count * 0.5); // 粗略估算每行约0.5KB
        result.put("estimatedCsvSizeMb", count * 0.2); // CSV约0.2KB每行

        return ResponseEntity.ok(result);
    }

    /**
     * 流式导出 Excel - 零内存占用，支持100万+行
     * 使用 StreamingResponseBody 直接流式写入HTTP响应，不生成中间文件
     */
    @GetMapping("/export/excel")
    public ResponseEntity<StreamingResponseBody> exportExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        String filename = String.format("财务报表_%s_%s.xlsx",
                startDate.format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                endDate.format(DateTimeFormatter.ofPattern("yyyyMMdd")));

        StreamingResponseBody responseBody = outputStream -> {
            try {
                financeExportService.exportExcelStreaming(startDate, endDate, outputStream);
                outputStream.flush();
            } catch (IOException e) {
                log.error("导出Excel失败", e);
                throw new RuntimeException("导出失败: " + e.getMessage(), e);
            }
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(responseBody);
    }

    /**
     * 流式导出 CSV - 内存占用更低，速度更快，适合超大数据量
     */
    @GetMapping("/export/csv")
    public ResponseEntity<StreamingResponseBody> exportCsv(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        String filename = String.format("财务报表_%s_%s.csv",
                startDate.format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                endDate.format(DateTimeFormatter.ofPattern("yyyyMMdd")));

        StreamingResponseBody responseBody = outputStream -> {
            try {
                financeExportService.exportCsvStreaming(startDate, endDate, outputStream);
                outputStream.flush();
            } catch (IOException e) {
                log.error("导出CSV失败", e);
                throw new RuntimeException("导出失败: " + e.getMessage(), e);
            }
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(responseBody);
    }

    /**
     * 获取单个报表详情
     */
    @GetMapping("/reports/{id}")
    public ResponseEntity<FinanceReport> getReportById(@PathVariable Long id) {
        return financeReportRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 创建测试数据 - 用于性能测试，生成指定数量的测试数据
     */
    @PostMapping("/test/generate")
    public ResponseEntity<Map<String, Object>> generateTestData(
            @RequestParam(defaultValue = "10000") int count) {

        Long tenantId = com.oms.config.TenantContext.getTenantId();
        LocalDate startDate = LocalDate.of(2024, 1, 1);

        for (int i = 0; i < count; i++) {
            FinanceReport report = new FinanceReport();
            report.setTenantId(tenantId);
            report.setReportDate(startDate.plusDays(i % 365));
            report.setRevenue(java.math.BigDecimal.valueOf(1000 + Math.random() * 10000));
            report.setCost(java.math.BigDecimal.valueOf(500 + Math.random() * 5000));
            report.setTax(java.math.BigDecimal.valueOf(Math.random() * 1000));
            report.setShippingFee(java.math.BigDecimal.valueOf(Math.random() * 500));
            report.setDiscountAmount(java.math.BigDecimal.valueOf(Math.random() * 300));
            report.setOrderCount((int) (10 + Math.random() * 100));
            report.setProductCount((int) (50 + Math.random() * 500));
            report.setCustomerCount((int) (5 + Math.random() * 50));
            report.setRegion("区域" + (i % 10));
            report.setDepartment("部门" + (i % 5));
            report.setSalesperson("销售" + (i % 20));
            report.setCurrency("CNY");

            financeReportRepository.save(report);

            if (i % 1000 == 0) {
                log.info("已生成 {} 条测试数据...", i);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("generated", count);
        result.put("message", "测试数据生成成功，可进行大数据量导出测试");
        return ResponseEntity.ok(result);
    }

    @Data
    public static class ExportResponse {
        private String downloadUrl;
        private String status;
        private String message;
    }
}
