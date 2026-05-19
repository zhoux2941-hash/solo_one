package com.oms.service;

import com.oms.config.TenantContext;
import com.oms.entity.FinanceReport;
import com.oms.repository.FinanceReportRepository;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinanceExportService {

    private final FinanceReportRepository financeReportRepository;

    private static final String[] EXCEL_HEADERS = {
        "日期", "营收(元)", "成本(元)", "利润(元)", "税费(元)",
        "运费(元)", "优惠金额(元)", "订单数", "商品数", "客户数",
        "地区", "部门", "销售人员", "货币", "备注"
    };

    private static final int ROW_ACCESS_WINDOW_SIZE = 100; // 内存中只保留100行，超过则写入临时文件

    /**
     * 流式导出 Excel - 使用 SXSSFWorkbook，内存占用极低，支持100万+行数据
     * 核心优化：
     * 1. 数据库流式查询，逐条处理不加载全部到内存
     * 2. SXSSF使用临时文件存储，内存只保留指定行数
     * 3. 直接写入 OutputStream，不缓存整个文件
     */
    @Transactional(readOnly = true) // 必须加只读事务，Stream需要在事务内使用
    public void exportExcelStreaming(LocalDate startDate, LocalDate endDate, OutputStream outputStream) throws IOException {
        Long tenantId = TenantContext.getTenantId();
        log.info("开始流式导出Excel, tenantId: {}, 时间范围: {} ~ {}", tenantId, startDate, endDate);

        // SXSSFWorkbook: 流式Excel，内存占用极低，临时文件存储
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(ROW_ACCESS_WINDOW_SIZE)) {
            workbook.setCompressTempFiles(true); // 压缩临时文件

            Sheet sheet = workbook.createSheet("财务报表");
            sheet.setRandomAccessWindowSize(ROW_ACCESS_WINDOW_SIZE);

            // 创建样式
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle numberStyle = createNumberStyle(workbook);

            // 写入表头
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < EXCEL_HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(EXCEL_HEADERS[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 4000);
            }

            AtomicInteger rowNum = new AtomicInteger(1);
            AtomicInteger totalExported = new AtomicInteger(0);

            // 数据库流式查询，逐条处理，内存只保留当前处理的一条数据
            try (var stream = financeReportRepository.streamByTenantIdAndDateRange(tenantId, startDate, endDate)) {
                stream.forEach(report -> {
                    Row row = sheet.createRow(rowNum.getAndIncrement());
                    writeReportRow(row, report, dateStyle, numberStyle);
                    totalExported.incrementAndGet();

                    // 每1万行输出一次日志
                    if (totalExported.get() % 10000 == 0) {
                        log.info("已导出 {} 行数据...", totalExported.get());
                    }
                });
            }

            // 写入汇总行
            writeSummaryRow(sheet, rowNum.get(), numberStyle);

            // 直接写入输出流，不生成中间文件
            workbook.write(outputStream);
            workbook.dispose(); // 清理临时文件

            log.info("Excel导出完成, 共导出 {} 行数据", totalExported.get());
        }
    }

    /**
     * 流式导出 CSV - 内存占用比Excel更低，适合超大数据量
     */
    @Transactional(readOnly = true)
    public void exportCsvStreaming(LocalDate startDate, LocalDate endDate, OutputStream outputStream) throws IOException {
        Long tenantId = TenantContext.getTenantId();
        log.info("开始流式导出CSV, tenantId: {}, 时间范围: {} ~ {}", tenantId, startDate, endDate);

        try (OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
             CSVWriter csvWriter = new CSVWriter(writer)) {

            // 写入BOM头，防止Excel打开乱码
            writer.write('\ufeff');

            // 写入表头
            csvWriter.writeNext(EXCEL_HEADERS);

            AtomicInteger totalExported = new AtomicInteger(0);

            // 流式查询，逐条写入
            try (var stream = financeReportRepository.streamByTenantIdAndDateRange(tenantId, startDate, endDate)) {
                stream.forEach(report -> {
                    String[] row = reportToStringArray(report);
                    csvWriter.writeNext(row);
                    totalExported.incrementAndGet();

                    if (totalExported.get() % 10000 == 0) {
                        log.info("CSV已导出 {} 行数据...", totalExported.get());
                    }
                });
            }

            log.info("CSV导出完成, 共导出 {} 行数据", totalExported.get());
        }
    }

    /**
     * 预估算数据量，用于前端警告
     */
    public long estimateExportCount(LocalDate startDate, LocalDate endDate) {
        Long tenantId = TenantContext.getTenantId();
        return financeReportRepository.countByTenantIdAndDateRange(tenantId, startDate, endDate);
    }

    private void writeReportRow(Row row, FinanceReport report, CellStyle dateStyle, CellStyle numberStyle) {
        int col = 0;
        Cell cell;

        cell = row.createCell(col++);
        cell.setCellValue(report.getReportDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        cell.setCellStyle(dateStyle);

        cell = row.createCell(col++);
        cell.setCellValue(report.getRevenue() != null ? report.getRevenue().doubleValue() : 0);
        cell.setCellStyle(numberStyle);

        cell = row.createCell(col++);
        cell.setCellValue(report.getCost() != null ? report.getCost().doubleValue() : 0);
        cell.setCellStyle(numberStyle);

        cell = row.createCell(col++);
        cell.setCellValue(report.getProfit() != null ? report.getProfit().doubleValue() : 0);
        cell.setCellStyle(numberStyle);

        cell = row.createCell(col++);
        cell.setCellValue(report.getTax() != null ? report.getTax().doubleValue() : 0);
        cell.setCellStyle(numberStyle);

        cell = row.createCell(col++);
        cell.setCellValue(report.getShippingFee() != null ? report.getShippingFee().doubleValue() : 0);
        cell.setCellStyle(numberStyle);

        cell = row.createCell(col++);
        cell.setCellValue(report.getDiscountAmount() != null ? report.getDiscountAmount().doubleValue() : 0);
        cell.setCellStyle(numberStyle);

        cell = row.createCell(col++);
        cell.setCellValue(report.getOrderCount() != null ? report.getOrderCount() : 0);

        cell = row.createCell(col++);
        cell.setCellValue(report.getProductCount() != null ? report.getProductCount() : 0);

        cell = row.createCell(col++);
        cell.setCellValue(report.getCustomerCount() != null ? report.getCustomerCount() : 0);

        row.createCell(col++).setCellValue(report.getRegion() != null ? report.getRegion() : "");
        row.createCell(col++).setCellValue(report.getDepartment() != null ? report.getDepartment() : "");
        row.createCell(col++).setCellValue(report.getSalesperson() != null ? report.getSalesperson() : "");
        row.createCell(col++).setCellValue(report.getCurrency() != null ? report.getCurrency() : "CNY");
        row.createCell(col++).setCellValue(report.getRemark() != null ? report.getRemark() : "");
    }

    private String[] reportToStringArray(FinanceReport report) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        return new String[]{
            report.getReportDate() != null ? report.getReportDate().format(formatter) : "",
            report.getRevenue() != null ? report.getRevenue().toString() : "0",
            report.getCost() != null ? report.getCost().toString() : "0",
            report.getProfit() != null ? report.getProfit().toString() : "0",
            report.getTax() != null ? report.getTax().toString() : "0",
            report.getShippingFee() != null ? report.getShippingFee().toString() : "0",
            report.getDiscountAmount() != null ? report.getDiscountAmount().toString() : "0",
            report.getOrderCount() != null ? report.getOrderCount().toString() : "0",
            report.getProductCount() != null ? report.getProductCount().toString() : "0",
            report.getCustomerCount() != null ? report.getCustomerCount().toString() : "0",
            report.getRegion() != null ? report.getRegion() : "",
            report.getDepartment() != null ? report.getDepartment() : "",
            report.getSalesperson() != null ? report.getSalesperson() : "",
            report.getCurrency() != null ? report.getCurrency() : "CNY",
            report.getRemark() != null ? report.getRemark() : ""
        };
    }

    private void writeSummaryRow(Sheet sheet, int rowNum, CellStyle numberStyle) {
        Row summaryRow = sheet.createRow(rowNum);
        CellStyle boldStyle = sheet.getWorkbook().createCellStyle();
        Font boldFont = sheet.getWorkbook().createFont();
        boldFont.setBold(true);
        boldStyle.setFont(boldFont);
        boldStyle.cloneStyleFrom(numberStyle);

        Cell cell0 = summaryRow.createCell(0);
        cell0.setCellValue("合计");
        cell0.setCellStyle(boldStyle);
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createNumberStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
}
