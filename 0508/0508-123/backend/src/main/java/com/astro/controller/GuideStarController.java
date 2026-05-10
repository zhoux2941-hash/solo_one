package com.astro.controller;

import com.astro.dto.*;
import com.astro.service.GuideStarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/guide-star")
@RequiredArgsConstructor
public class GuideStarController {

    private final GuideStarService guideStarService;

    @GetMapping("/catalog")
    public ResponseEntity<List<GuideStarCatalog>> getGuideStarCatalog() {
        List<GuideStarCatalog> stars = guideStarService.getGuideStarCatalog();
        return ResponseEntity.ok(stars);
    }

    @GetMapping("/recommend")
    public ResponseEntity<List<GuideStarCatalog>> getRecommendedGuideStars(
            @RequestParam Double targetRa,
            @RequestParam Double targetDec,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {
        List<GuideStarCatalog> stars = guideStarService.getRecommendedGuideStars(
                targetRa, targetDec, time);
        return ResponseEntity.ok(stars);
    }

    @PostMapping("/simulate")
    public ResponseEntity<GuideStarResponse> simulateGuiding(
            @Valid @RequestBody GuideStarRequest request) {
        GuideStarResponse response = guideStarService.simulateGuiding(request);
        return ResponseEntity.ok(response);
    }
}
