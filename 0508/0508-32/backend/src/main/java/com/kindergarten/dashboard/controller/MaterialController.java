package com.kindergarten.dashboard.controller;

import com.kindergarten.dashboard.dto.WarningResponseDTO;
import com.kindergarten.dashboard.service.MaterialService;
import com.kindergarten.dashboard.service.WarningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/material")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;
    private final WarningService warningService;

    @GetMapping("/trend")
    public ResponseEntity<Map<String, Object>> getTrend() {
        log.info("Getting material trend data");
        Map<String, Object> data = materialService.getTrendData();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/share")
    public ResponseEntity<Map<String, Object>> getShare() {
        log.info("Getting material share data");
        Map<String, Object> data = materialService.getShareData();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/warning")
    public ResponseEntity<WarningResponseDTO> getWarning() {
        log.info("Getting material warning data");
        WarningResponseDTO data = warningService.getWarnings();
        return ResponseEntity.ok(data);
    }
}
