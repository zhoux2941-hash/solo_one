package com.company.grouporder.service;

import com.company.grouporder.dto.ParticipantPayment;
import com.company.grouporder.entity.GroupOrder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final GroupOrderService groupOrderService;

    public byte[] exportOrderToExcel(Long orderId) throws IOException {
        GroupOrder order = groupOrderService.getOrderById(orderId);
        List<ParticipantPayment> payments = groupOrderService.getPaymentDetails(orderId);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet summarySheet = workbook.createSheet("拼单汇总");
            Sheet detailSheet = workbook.createSheet("明细");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle moneyStyle = createMoneyStyle(workbook);

            createSummarySheet(summarySheet, order, payments, headerStyle, moneyStyle);
            createDetailSheet(detailSheet, payments, headerStyle, moneyStyle);

            summarySheet.autoSizeColumn(0);
            summarySheet.autoSizeColumn(1);
            detailSheet.autoSizeColumn(0);
            detailSheet.autoSizeColumn(1);
            detailSheet.autoSizeColumn(2);
            detailSheet.autoSizeColumn(3);
            detailSheet.autoSizeColumn(4);
            detailSheet.autoSizeColumn(5);
            detailSheet.autoSizeColumn(6);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            log.info("导出Excel成功: orderId={}", orderId);
            return outputStream.toByteArray();
        }
    }

    private void createSummarySheet(Sheet sheet, GroupOrder order, List<ParticipantPayment> payments,
                                     CellStyle headerStyle, CellStyle moneyStyle) {
        int rowNum = 0;
        
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("拼单详情");
        CellStyle titleStyle = sheet.getWorkbook().createCellStyle();
        Font titleFont = sheet.getWorkbook().createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 16);
        titleStyle.setFont(titleFont);
        titleCell.setCellStyle(titleStyle);
        
        rowNum++;
        
        Row infoRow1 = sheet.createRow(rowNum++);
        infoRow1.createCell(0).setCellValue("商家: " + order.getMerchant());
        
        Row infoRow2 = sheet.createRow(rowNum++);
        infoRow2.createCell(0).setCellValue("满减规则: 满" + order.getMinAmount() + "减" + order.getDiscountAmount());
        
        Row infoRow3 = sheet.createRow(rowNum++);
        infoRow3.createCell(0).setCellValue("发起人: " + order.getInitiatorName());
        
        Row infoRow4 = sheet.createRow(rowNum++);
        infoRow4.createCell(0).setCellValue("总价: " + order.getTotalAmount() + " 元");
        
        Row infoRow5 = sheet.createRow(rowNum++);
        infoRow5.createCell(0).setCellValue("实付: " + order.getFinalAmount() + " 元");
        
        rowNum++;
        
        Row headerRow = sheet.createRow(rowNum++);
        String[] headers = {"参与人", "原价(元)", "实付(元)", "优惠(元)"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        for (ParticipantPayment payment : payments) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(payment.getUserName());
            
            Cell totalCell = row.createCell(1);
            totalCell.setCellValue(payment.getTotalAmount().doubleValue());
            totalCell.setCellStyle(moneyStyle);
            
            Cell finalCell = row.createCell(2);
            finalCell.setCellValue(payment.getFinalAmount().doubleValue());
            finalCell.setCellStyle(moneyStyle);
            
            Cell discountCell = row.createCell(3);
            discountCell.setCellValue(payment.getDiscountAmount().doubleValue());
            discountCell.setCellStyle(moneyStyle);
        }
    }

    private void createDetailSheet(Sheet sheet, List<ParticipantPayment> payments,
                                    CellStyle headerStyle, CellStyle moneyStyle) {
        int rowNum = 0;
        
        Row headerRow = sheet.createRow(rowNum++);
        String[] headers = {"参与人", "商品名称", "单价(元)", "数量", "小计(元)", "实付(元)"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        for (ParticipantPayment payment : payments) {
            for (ParticipantPayment.PaymentItem item : payment.getItems()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(payment.getUserName());
                row.createCell(1).setCellValue(item.getItemName());
                
                Cell priceCell = row.createCell(2);
                priceCell.setCellValue(item.getPrice().doubleValue());
                priceCell.setCellStyle(moneyStyle);
                
                row.createCell(3).setCellValue(item.getQuantity());
                
                Cell subtotalCell = row.createCell(4);
                subtotalCell.setCellValue(item.getSubtotal().doubleValue());
                subtotalCell.setCellStyle(moneyStyle);
                
                Cell finalCell = row.createCell(5);
                finalCell.setCellValue(item.getFinalPrice().doubleValue());
                finalCell.setCellStyle(moneyStyle);
            }
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createMoneyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("0.00"));
        return style;
    }
}
