package com.escaperoom.service;

import com.escaperoom.dto.PuzzleDTO;
import com.escaperoom.dto.SceneDTO;
import com.escaperoom.dto.ScriptDTO;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.property.TextAlignment;
import com.itextpdf.layout.property.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class PdfService {

    public byte[] generateScriptPdf(ScriptDTO script) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        
        PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        
        Paragraph title = new Paragraph(script.getName())
                .setFont(boldFont)
                .setFontSize(24)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(title);
        
        Table infoTable = new Table(2);
        infoTable.setWidth(UnitValue.createPercentValue(100));
        
        infoTable.addCell(new Cell().add(new Paragraph("难度:").setFont(boldFont)));
        infoTable.addCell(new Cell().add(new Paragraph(script.getDifficulty()).setFont(font)));
        
        document.add(infoTable);
        document.add(new Paragraph("\n"));
        
        if (script.getBackgroundStory() != null && !script.getBackgroundStory().isEmpty()) {
            Paragraph bgTitle = new Paragraph("背景故事")
                    .setFont(boldFont)
                    .setFontSize(16)
                    .setMarginTop(10)
                    .setMarginBottom(10);
            document.add(bgTitle);
            document.add(new Paragraph(script.getBackgroundStory()).setFont(font).setMarginBottom(20));
        }
        
        if (script.getScenes() != null && !script.getScenes().isEmpty()) {
            int sceneNum = 1;
            for (SceneDTO scene : script.getScenes()) {
                Paragraph sceneTitle = new Paragraph("场景 " + sceneNum + ": " + scene.getName())
                        .setFont(boldFont)
                        .setFontSize(14)
                        .setMarginTop(20)
                        .setMarginBottom(10)
                        .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY);
                document.add(sceneTitle);
                
                if (scene.getDescription() != null && !scene.getDescription().isEmpty()) {
                    Paragraph descTitle = new Paragraph("场景描述:").setFont(boldFont);
                    document.add(descTitle);
                    document.add(new Paragraph(scene.getDescription()).setFont(font).setMarginBottom(10));
                }
                
                if (scene.getPuzzles() != null && !scene.getPuzzles().isEmpty()) {
                    int puzzleNum = 1;
                    for (PuzzleDTO puzzle : scene.getPuzzles()) {
                        Paragraph puzzleTitle = new Paragraph("  谜题 " + puzzleNum + ": " + puzzle.getName())
                                .setFont(boldFont)
                                .setMarginTop(10);
                        document.add(puzzleTitle);
                        
                        Table puzzleTable = new Table(2);
                        puzzleTable.setWidth(UnitValue.createPercentValue(100));
                        puzzleTable.setMarginLeft(20);
                        
                        puzzleTable.addCell(new Cell().add(new Paragraph("谜面:").setFont(boldFont)));
                        puzzleTable.addCell(new Cell().add(new Paragraph(puzzle.getPuzzleText()).setFont(font)));
                        
                        puzzleTable.addCell(new Cell().add(new Paragraph("解谜方式:").setFont(boldFont)));
                        puzzleTable.addCell(new Cell().add(new Paragraph(puzzle.getSolutionMethod()).setFont(font)));
                        
                        puzzleTable.addCell(new Cell().add(new Paragraph("答案:").setFont(boldFont)));
                        puzzleTable.addCell(new Cell().add(new Paragraph(puzzle.getAnswer()).setFont(font)));
                        
                        if (puzzle.getUnlockCondition() != null && !puzzle.getUnlockCondition().isEmpty()) {
                            puzzleTable.addCell(new Cell().add(new Paragraph("解锁条件:").setFont(boldFont)));
                            puzzleTable.addCell(new Cell().add(new Paragraph(puzzle.getUnlockCondition()).setFont(font)));
                        }
                        
                        document.add(puzzleTable);
                        puzzleNum++;
                    }
                }
                sceneNum++;
            }
        }
        
        document.close();
        return baos.toByteArray();
    }
}
