package com.festival.volunteer.service;

import com.festival.volunteer.entity.Schedule;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExcelExportService {

    private final ScheduleService scheduleService;

    public byte[] exportScheduleExcel() throws IOException {
        List<Schedule> schedules = scheduleService.getAllSchedules();
        
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("排班表");
            
            createHeaderRow(workbook, sheet);
            createDataRows(workbook, sheet, schedules);
            
            for (int i = 0; i < 8; i++) {
                sheet.autoSizeColumn(i);
            }
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private void createHeaderRow(Workbook workbook, Sheet sheet) {
        Row headerRow = sheet.createRow(0);
        
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);
        
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        
        String[] headers = {"志愿者姓名", "联系电话", "岗位名称", "岗位类型", 
                          "排班日期", "开始时间", "结束时间", "地点", "状态"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
    }

    private void createDataRows(Workbook workbook, Sheet sheet, List<Schedule> schedules) {
        CellStyle dataStyle = workbook.createCellStyle();
        dataStyle.setBorderBottom(BorderStyle.THIN);
        dataStyle.setBorderTop(BorderStyle.THIN);
        dataStyle.setBorderLeft(BorderStyle.THIN);
        dataStyle.setBorderRight(BorderStyle.THIN);
        
        int rowNum = 1;
        for (Schedule schedule : schedules) {
            Row row = sheet.createRow(rowNum++);
            
            Cell nameCell = row.createCell(0);
            nameCell.setCellValue(schedule.getVolunteer().getName());
            nameCell.setCellStyle(dataStyle);
            
            Cell phoneCell = row.createCell(1);
            phoneCell.setCellValue(schedule.getVolunteer().getPhone() != null ? 
                schedule.getVolunteer().getPhone() : "");
            phoneCell.setCellStyle(dataStyle);
            
            Cell positionCell = row.createCell(2);
            positionCell.setCellValue(schedule.getPosition().getName());
            positionCell.setCellStyle(dataStyle);
            
            Cell typeCell = row.createCell(3);
            typeCell.setCellValue(schedule.getPosition().getType().getDisplayName());
            typeCell.setCellStyle(dataStyle);
            
            Cell dateCell = row.createCell(4);
            dateCell.setCellValue(schedule.getScheduleDate());
            dateCell.setCellStyle(dataStyle);
            
            Cell startCell = row.createCell(5);
            startCell.setCellValue(schedule.getStartTime());
            startCell.setCellStyle(dataStyle);
            
            Cell endCell = row.createCell(6);
            endCell.setCellValue(schedule.getEndTime());
            endCell.setCellStyle(dataStyle);
            
            Cell locationCell = row.createCell(7);
            locationCell.setCellValue(schedule.getLocation());
            locationCell.setCellStyle(dataStyle);
            
            Cell statusCell = row.createCell(8);
            statusCell.setCellValue(schedule.getStatus().getDisplayName());
            statusCell.setCellStyle(dataStyle);
        }
    }
}
