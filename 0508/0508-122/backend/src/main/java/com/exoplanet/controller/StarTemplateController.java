package com.exoplanet.controller;

import com.exoplanet.entity.StarTemplate;
import com.exoplanet.service.StarTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/stars")
@RequiredArgsConstructor
public class StarTemplateController {

    private final StarTemplateService starTemplateService;

    @GetMapping
    public ResponseEntity<List<StarTemplate>> getAllStarTemplates() {
        log.info("Requesting all star templates");
        List<StarTemplate> templates = starTemplateService.getAllTemplates();
        log.info("Returning {} star templates", templates.size());
        return ResponseEntity.ok(templates);
    }
}