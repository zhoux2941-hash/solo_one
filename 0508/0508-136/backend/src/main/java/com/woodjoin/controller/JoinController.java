package com.woodjoin.controller;

import com.woodjoin.dto.JoinParamsDTO;
import com.woodjoin.service.JoinCalculationService;
import com.woodjoin.service.PdfExportService;
import com.woodjoin.service.StlExportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/join")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JoinController {

    private final JoinCalculationService joinCalculationService;
    private final StlExportService stlExportService;
    private final PdfExportService pdfExportService;

    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculate(@Valid @RequestBody JoinParamsDTO params) {
        Map<String, Object> result = joinCalculationService.calculateJoin(params);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/export/stl")
    public ResponseEntity<byte[]> exportStl(@Valid @RequestBody JoinParamsDTO params) {
        byte[] data = stlExportService.exportToStl(params);
        String filename = generateFilename(params, "stl");
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=" + URLEncoder.encode(filename, StandardCharsets.UTF_8))
                .contentType(MediaType.parseMediaType("application/octet-stream"))
                .contentLength(data.length)
                .body(data);
    }

    @PostMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@Valid @RequestBody JoinParamsDTO params) {
        byte[] data = pdfExportService.exportToPdf(params);
        String filename = generateFilename(params, "pdf");
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=" + URLEncoder.encode(filename, StandardCharsets.UTF_8))
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(data.length)
                .body(data);
    }

    private String generateFilename(JoinParamsDTO params, String extension) {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return String.format("榫卯_%s_%s.%s", 
                params.getJoinType().getDisplayName(), 
                time, 
                extension);
    }
}