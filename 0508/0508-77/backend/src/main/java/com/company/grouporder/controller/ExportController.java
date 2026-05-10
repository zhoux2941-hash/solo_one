package com.company.grouporder.controller;

import com.company.grouporder.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/{orderId}/excel")
    public ResponseEntity<byte[]> exportOrder(@PathVariable Long orderId) throws IOException {
        byte[] data = exportService.exportOrderToExcel(orderId);
        
        String filename = URLEncoder.encode("拼单明细_" + orderId + ".xlsx", StandardCharsets.UTF_8.name());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}
