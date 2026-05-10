package com.lawyer.letter.util;

import org.apache.poi.xwpf.usermodel.*;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class WordGenerator {

    public static File generateDocx(String templateContent, Map<String, String> placeholders, String outputPath) throws IOException {
        String processedContent = replacePlaceholders(templateContent, placeholders);
        return createDocxFile(processedContent, outputPath);
    }

    private static String replacePlaceholders(String content, Map<String, String> placeholders) {
        String result = content;
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            String placeholder = "\\$\\{placeholder_" + entry.getKey() + "\\}";
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replaceAll(placeholder, Matcher.quoteReplacement(value));
        }
        Pattern remainingPattern = Pattern.compile("\\$\\{placeholder_[^}]+\\}");
        Matcher matcher = remainingPattern.matcher(result);
        result = matcher.replaceAll("");
        return result;
    }

    private static File createDocxFile(String content, String outputPath) throws IOException {
        try (XWPFDocument document = new XWPFDocument()) {
            String[] lines = content.split("\n");
            for (String line : lines) {
                if (line.trim().isEmpty()) {
                    XWPFParagraph paragraph = document.createParagraph();
                    XWPFRun run = paragraph.createRun();
                    run.setText("");
                } else {
                    XWPFParagraph paragraph = document.createParagraph();
                    XWPFRun run = paragraph.createRun();
                    run.setText(line);
                    run.setFontFamily("宋体");
                    run.setFontSize(12);
                    if (line.contains("律师事务所") && !line.contains("致：")) {
                        run.setBold(true);
                        run.setFontSize(14);
                        paragraph.setAlignment(ParagraphAlignment.CENTER);
                    }
                    if (line.contains("关于：")) {
                        run.setBold(true);
                    }
                }
            }
            File outputFile = new File(outputPath);
            File parentDir = outputFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }
            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                document.write(fos);
            }
            return outputFile;
        }
    }

    public static File generateRtf(String templateContent, Map<String, String> placeholders, String outputPath) throws IOException {
        String processedContent = replacePlaceholders(templateContent, placeholders);
        return createRtfFile(processedContent, outputPath);
    }

    private static File createRtfFile(String content, String outputPath) throws IOException {
        StringBuilder rtfContent = new StringBuilder();
        rtfContent.append("{\\rtf1\\ansi\\ansicpg936\\deff0\\deflang1033\\deflangfe2052{\\fonttbl{\\f0\\fnil\\fcharset134 SimSun;}{\\f1\\fnil\\fcharset134 SimHei;}}\n");
        rtfContent.append("{\\colortbl;\\red0\\green0\\blue0;}\n");
        rtfContent.append("\\viewkind4\\uc1\\pard\\lang2052\\f0\\fs24\\langfe2052\\noproof\n");
        String[] lines = content.split("\n");
        for (String line : lines) {
            if (line.trim().isEmpty()) {
                rtfContent.append("\\par\n");
            } else {
                String encodedLine = encodeRtf(line);
                if (line.contains("律师事务所") && !line.contains("致：")) {
                    rtfContent.append("\\qc\\b\\fs28").append(encodedLine).append("\\b0\\fs24\\ql\\par\n");
                } else if (line.contains("关于：")) {
                    rtfContent.append("\\b").append(encodedLine).append("\\b0\\par\n");
                } else {
                    rtfContent.append(encodedLine).append("\\par\n");
                }
            }
        }
        rtfContent.append("}");
        File outputFile = new File(outputPath);
        File parentDir = outputFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }
        try (BufferedWriter writer = new BufferedWriter(
                new OutputStreamWriter(new FileOutputStream(outputFile), StandardCharsets.US_ASCII))) {
            writer.write(rtfContent.toString());
        }
        return outputFile;
    }

    private static String encodeRtf(String text) {
        StringBuilder sb = new StringBuilder();
        for (char ch : text.toCharArray()) {
            if (ch < 128) {
                if (ch == '\\' || ch == '{' || ch == '}') {
                    sb.append('\\').append(ch);
                } else if (ch == '\t') {
                    sb.append("\\tab");
                } else {
                    sb.append(ch);
                }
            } else {
                int codePoint = (int) ch;
                if (codePoint > 32767) {
                    codePoint = codePoint - 65536;
                }
                sb.append("\\u").append(codePoint).append("?");
            }
        }
        return sb.toString();
    }
}
