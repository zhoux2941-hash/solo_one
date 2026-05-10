package com.woodjoin.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.woodjoin.dto.JoinParamsDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfExportService {

    private final JoinCalculationService joinCalculationService;

    public byte[] exportToPdf(JoinParamsDTO params) {
        log.info("开始导出PDF: {}", params.getJoinType());
        
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(bos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);
            
            String title = "榫卯结构参数化图纸 - " + params.getJoinType().getDisplayName();
            Paragraph titlePara = new Paragraph(title)
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(titlePara);
            
            String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            Paragraph timePara = new Paragraph("生成时间: " + timeStr)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(15);
            document.add(timePara);
            
            Map<String, Object> calculation = joinCalculationService.calculateJoin(params);
            
            document.add(new Paragraph("一、木料参数").setFontSize(14).setBold().setMarginTop(10).setMarginBottom(8));
            
            Table woodTable = new Table(UnitValue.createPercentArray(new float[]{3, 3, 3}));
            woodTable.setWidth(UnitValue.createPercentValue(80));
            woodTable.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
            
            addHeaderCell(woodTable, "参数");
            addHeaderCell(woodTable, "数值 (mm)");
            addHeaderCell(woodTable, "说明");
            
            addDataCell(woodTable, "长度");
            addDataCell(woodTable, String.format("%.2f", params.getWoodLength()));
            addDataCell(woodTable, "木料总长度");
            
            addDataCell(woodTable, "宽度");
            addDataCell(woodTable, String.format("%.2f", params.getWoodWidth()));
            addDataCell(woodTable, "木料截面宽度");
            
            addDataCell(woodTable, "高度");
            addDataCell(woodTable, String.format("%.2f", params.getWoodHeight()));
            addDataCell(woodTable, "木料截面高度");
            
            document.add(woodTable);
            
            document.add(new Paragraph("二、榫卯参数").setFontSize(14).setBold().setMarginTop(15).setMarginBottom(8));
            
            Table tenonTable = new Table(UnitValue.createPercentArray(new float[]{3, 3, 3}));
            tenonTable.setWidth(UnitValue.createPercentValue(80));
            tenonTable.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
            
            addHeaderCell(tenonTable, "参数");
            addHeaderCell(tenonTable, "数值 (mm)");
            addHeaderCell(tenonTable, "说明");
            
            addDataCell(tenonTable, "榫头长度");
            addDataCell(tenonTable, String.format("%.2f", params.getTenonLength()));
            addDataCell(tenonTable, "榫头伸出长度");
            
            addDataCell(tenonTable, "榫头宽度");
            addDataCell(tenonTable, String.format("%.2f", params.getTenonWidth()));
            addDataCell(tenonTable, "榫头截面宽度");
            
            addDataCell(tenonTable, "榫头高度");
            addDataCell(tenonTable, String.format("%.2f", params.getTenonHeight()));
            addDataCell(tenonTable, "榫头截面高度");
            
            addDataCell(tenonTable, "加工余量");
            addDataCell(tenonTable, String.format("%.2f", params.getMargin()));
            addDataCell(tenonTable, "预留加工空间");
            
            document.add(tenonTable);
            
            document.add(new Paragraph("三、计算结果").setFontSize(14).setBold().setMarginTop(15).setMarginBottom(8));
            
            Table resultTable = new Table(UnitValue.createPercentArray(new float[]{3, 3, 3}));
            resultTable.setWidth(UnitValue.createPercentValue(80));
            resultTable.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
            
            addHeaderCell(resultTable, "项目");
            addHeaderCell(resultTable, "数值");
            addHeaderCell(resultTable, "说明");
            
            addCalculationResult(resultTable, calculation);
            
            document.add(resultTable);
            
            document.add(new Paragraph("四、加工说明").setFontSize(14).setBold().setMarginTop(15).setMarginBottom(8));
            
            Table noteTable = new Table(UnitValue.createPercentArray(new float[]{1, 9}));
            noteTable.setWidth(UnitValue.createPercentValue(80));
            noteTable.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
            
            addHeaderCell(noteTable, "序号");
            addHeaderCell(noteTable, "注意事项");
            
            addDataCell(noteTable, "1");
            addDataCell(noteTable, "请按照图纸尺寸精确加工，误差控制在±0.1mm以内");
            
            addDataCell(noteTable, "2");
            addDataCell(noteTable, "榫卯连接处建议留0.1-0.2mm间隙，便于装配");
            
            addDataCell(noteTable, "3");
            addDataCell(noteTable, "先进行试装配，确认尺寸无误后再进行正式胶合");
            
            addDataCell(noteTable, "4");
            addDataCell(noteTable, "加工前请确认木料已干燥处理，含水率控制在8-12%");
            
            document.add(noteTable);
            
            Paragraph footer = new Paragraph("本图纸由榫卯结构参数化工具生成，仅供参考，请根据实际情况调整。")
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(30)
                    .setFontColor(ColorConstants.GRAY);
            document.add(footer);
            
            document.close();
            log.info("PDF导出完成，大小: {} bytes", bos.size());
            return bos.toByteArray();
        } catch (IOException e) {
            log.error("PDF导出失败", e);
            throw new RuntimeException("PDF导出失败", e);
        }
    }

    private void addCalculationResult(Table table, Map<String, Object> calculation) {
        if (calculation.containsKey("tailCount")) {
            addDataCell(table, "燕尾数量");
            addDataCell(table, String.valueOf(calculation.get("tailCount")));
            addDataCell(table, "燕尾榫头数量");
        }
        if (calculation.containsKey("tailWidth")) {
            addDataCell(table, "燕尾顶部宽度");
            addDataCell(table, String.format("%.2f mm", calculation.get("tailWidth")));
            addDataCell(table, "榫头窄边宽度");
        }
        if (calculation.containsKey("tailBottomWidth")) {
            addDataCell(table, "燕尾底部宽度");
            addDataCell(table, String.format("%.2f mm", calculation.get("tailBottomWidth")));
            addDataCell(table, "榫头宽边宽度");
        }
        if (calculation.containsKey("tailOffset")) {
            addDataCell(table, "侧向偏移量");
            addDataCell(table, String.format("%.2f mm", calculation.get("tailOffset")));
            addDataCell(table, "单侧梯形偏移");
        }
        if (calculation.containsKey("tailAngle")) {
            addDataCell(table, "燕尾角度");
            addDataCell(table, calculation.get("tailAngle") + "°");
            addDataCell(table, "燕尾侧面角度(与垂直面)");
        }
        if (calculation.containsKey("fingerCount")) {
            addDataCell(table, "指接数量");
            addDataCell(table, String.valueOf(calculation.get("fingerCount")));
            addDataCell(table, "框榫指接数量");
        }
        if (calculation.containsKey("fit")) {
            addDataCell(table, "配合类型");
            addDataCell(table, String.valueOf(calculation.get("fit")));
            addDataCell(table, "榫卯配合方式");
        }
    }

    private void addHeaderCell(Table table, String text) {
        Cell cell = new Cell()
                .add(new Paragraph(text).setBold())
                .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(5);
        table.addHeaderCell(cell);
    }

    private void addDataCell(Table table, String text) {
        Cell cell = new Cell()
                .add(new Paragraph(text))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(5);
        table.addCell(cell);
    }
}