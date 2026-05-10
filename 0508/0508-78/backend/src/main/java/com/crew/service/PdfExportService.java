package com.crew.service;

import com.crew.entity.Notice;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PdfExportService {
    
    @Autowired
    private WeatherService weatherService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy年MM月dd日");
    private static final float PAGE_WIDTH = 595;
    private static final float PAGE_HEIGHT = 842;
    private static final float MARGIN = 50;
    
    public byte[] exportNoticesToPdf(List<Notice> notices, LocalDate date, String location) throws IOException {
        PDDocument document = new PDDocument();
        PDPage page = new PDPage();
        document.addPage(page);
        
        Map<String, Object> weather = weatherService.getWeather(location, date);
        
        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            float yPosition = PAGE_HEIGHT - MARGIN;
            
            yPosition = drawHeader(contentStream, date, location, weather, yPosition);
            yPosition = drawNotices(contentStream, notices, yPosition, document);
            
            drawFooter(contentStream, yPosition);
        }
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.save(baos);
        document.close();
        
        return baos.toByteArray();
    }
    
    private float drawHeader(PDPageContentStream contentStream, LocalDate date, String location, 
                              Map<String, Object> weather, float startY) throws IOException {
        float y = startY;
        
        contentStream.setNonStrokingColor(new Color(70, 130, 180));
        contentStream.addRect(MARGIN, y - 50, PAGE_WIDTH - 2 * MARGIN, 50);
        contentStream.fill();
        
        contentStream.setNonStrokingColor(Color.WHITE);
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 20);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN + 20, y - 32);
        contentStream.showText("影视剧组通告单");
        contentStream.endText();
        
        y -= 70;
        
        contentStream.setNonStrokingColor(Color.BLACK);
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, y);
        contentStream.showText("拍摄日期：" + DATE_FORMATTER.format(date));
        contentStream.endText();
        
        y -= 20;
        
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, y);
        contentStream.showText("拍摄地点：" + location);
        contentStream.endText();
        
        y -= 30;
        
        contentStream.setNonStrokingColor(new Color(240, 248, 255));
        contentStream.addRect(MARGIN, y - 80, PAGE_WIDTH - 2 * MARGIN, 80);
        contentStream.fill();
        
        contentStream.setNonStrokingColor(new Color(70, 130, 180));
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN + 10, y - 20);
        contentStream.showText("🌤️ 天气预报");
        contentStream.endText();
        
        contentStream.setNonStrokingColor(Color.BLACK);
        contentStream.setFont(PDType1Font.HELVETICA, 11);
        
        float col1X = MARGIN + 10;
        float col2X = MARGIN + 120;
        float col3X = MARGIN + 230;
        float col4X = MARGIN + 340;
        
        contentStream.beginText();
        contentStream.newLineAtOffset(col1X, y - 45);
        contentStream.showText("天气：" + weather.getOrDefault("weatherDesc", "--"));
        contentStream.endText();
        
        contentStream.beginText();
        contentStream.newLineAtOffset(col2X, y - 45);
        contentStream.showText("温度：" + weather.getOrDefault("temperature", "--"));
        contentStream.endText();
        
        contentStream.beginText();
        contentStream.newLineAtOffset(col3X, y - 45);
        contentStream.showText("体感：" + weather.getOrDefault("feelsLike", "--"));
        contentStream.endText();
        
        contentStream.beginText();
        contentStream.newLineAtOffset(col4X, y - 45);
        contentStream.showText("湿度：" + weather.getOrDefault("humidity", "--"));
        contentStream.endText();
        
        contentStream.beginText();
        contentStream.newLineAtOffset(col1X, y - 65);
        contentStream.showText("风速：" + weather.getOrDefault("windSpeed", "--"));
        contentStream.endText();
        
        if (!(Boolean) weather.getOrDefault("success", false)) {
            contentStream.setNonStrokingColor(Color.RED);
            contentStream.beginText();
            contentStream.newLineAtOffset(col2X, y - 65);
            contentStream.showText("* 天气数据仅供参考");
            contentStream.endText();
        }
        
        y -= 100;
        
        contentStream.setNonStrokingColor(new Color(70, 130, 180));
        contentStream.setLineWidth(1.5f);
        contentStream.moveTo(MARGIN, y);
        contentStream.lineTo(PAGE_WIDTH - MARGIN, y);
        contentStream.stroke();
        
        y -= 20;
        
        return y;
    }
    
    private float drawNotices(PDPageContentStream contentStream, List<Notice> notices, 
                               float startY, PDDocument document) throws IOException {
        float y = startY;
        
        if (notices.isEmpty()) {
            contentStream.setNonStrokingColor(Color.GRAY);
            contentStream.setFont(PDType1Font.HELVETICA_OBLIQUE, 14);
            contentStream.beginText();
            contentStream.newLineAtOffset(PAGE_WIDTH / 2 - 60, y - 20);
            contentStream.showText("该日期暂无通告安排");
            contentStream.endText();
            return y - 50;
        }
        
        contentStream.setNonStrokingColor(Color.BLACK);
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, y);
        contentStream.showText("拍摄安排（共" + notices.size() + "场）");
        contentStream.endText();
        
        y -= 25;
        
        int index = 1;
        for (Notice notice : notices) {
            if (y < 100) {
                PDPage newPage = new PDPage();
                document.addPage(newPage);
                contentStream.close();
                PDPageContentStream newContentStream = new PDPageContentStream(document, newPage);
                y = PAGE_HEIGHT - MARGIN;
                y = drawContinuationHeader(newContentStream, y);
            }
            
            y = drawNoticeCard(contentStream, notice, index, y);
            index++;
        }
        
        return y;
    }
    
    private float drawContinuationHeader(PDPageContentStream contentStream, float startY) throws IOException {
        float y = startY;
        
        contentStream.setNonStrokingColor(new Color(70, 130, 180));
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, y);
        contentStream.showText("（续上页）");
        contentStream.endText();
        
        y -= 25;
        return y;
    }
    
    private float drawNoticeCard(PDPageContentStream contentStream, Notice notice, 
                                  int index, float startY) throws IOException {
        float y = startY;
        float cardHeight = 140;
        
        contentStream.setNonStrokingColor(new Color(250, 250, 250));
        contentStream.addRect(MARGIN, y - cardHeight, PAGE_WIDTH - 2 * MARGIN, cardHeight);
        contentStream.fill();
        
        contentStream.setStrokingColor(new Color(200, 200, 200));
        contentStream.setLineWidth(1f);
        contentStream.addRect(MARGIN, y - cardHeight, PAGE_WIDTH - 2 * MARGIN, cardHeight);
        contentStream.stroke();
        
        contentStream.setNonStrokingColor(new Color(70, 130, 180));
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 13);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN + 15, y - 20);
        contentStream.showText("第" + index + "场：" + notice.getSceneName());
        contentStream.endText();
        
        contentStream.setNonStrokingColor(Color.BLACK);
        contentStream.setFont(PDType1Font.HELVETICA, 11);
        
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN + 15, y - 42);
        contentStream.showText("⏰ 时间：" + notice.getStartTime() + " - " + notice.getEndTime());
        contentStream.endText();
        
        String actors = notice.getActors().stream()
                .map(a -> a.getName())
                .collect(Collectors.joining("、"));
        if (actors.length() > 50) {
            actors = actors.substring(0, 50) + "...";
        }
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN + 15, y - 60);
        contentStream.showText("🎭 演员：" + (actors.isEmpty() ? "无" : actors));
        contentStream.endText();
        
        String costume = notice.getCostumeRequirement();
        if (costume != null && !costume.isEmpty()) {
            if (costume.length() > 60) costume = costume.substring(0, 60) + "...";
            contentStream.beginText();
            contentStream.newLineAtOffset(MARGIN + 15, y - 78);
            contentStream.showText("👔 服装：" + costume);
            contentStream.endText();
        }
        
        String prop = notice.getPropRequirement();
        if (prop != null && !prop.isEmpty()) {
            if (prop.length() > 60) prop = prop.substring(0, 60) + "...";
            contentStream.beginText();
            contentStream.newLineAtOffset(MARGIN + 15, y - 96);
            contentStream.showText("🎬 道具：" + prop);
            contentStream.endText();
        }
        
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN + 15, y - 114);
        contentStream.showText("导演：" + (notice.getDirector() != null ? notice.getDirector().getName() : "未指定"));
        contentStream.endText();
        
        contentStream.setNonStrokingColor(notice.getMaterialsReady() ? new Color(34, 139, 34) : new Color(255, 140, 0));
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 10);
        contentStream.beginText();
        contentStream.newLineAtOffset(PAGE_WIDTH - MARGIN - 100, y - 114);
        contentStream.showText(notice.getMaterialsReady() ? "✓ 物资已备齐" : "⏳ 物资待确认");
        contentStream.endText();
        
        y -= (cardHeight + 15);
        
        return y;
    }
    
    private void drawFooter(PDPageContentStream contentStream, float y) throws IOException {
        contentStream.setStrokingColor(new Color(200, 200, 200));
        contentStream.setLineWidth(1f);
        contentStream.moveTo(MARGIN, 50);
        contentStream.lineTo(PAGE_WIDTH - MARGIN, 50);
        contentStream.stroke();
        
        contentStream.setNonStrokingColor(Color.GRAY);
        contentStream.setFont(PDType1Font.HELVETICA, 9);
        contentStream.beginText();
        contentStream.newLineAtOffset(PAGE_WIDTH / 2 - 80, 35);
        contentStream.showText("本通告单由影视剧组通告管理系统生成");
        contentStream.endText();
    }
}