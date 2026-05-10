package com.astro.controller;

import com.astro.entity.ObservationImage;
import com.astro.service.FlatFieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final FlatFieldService flatFieldService;

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ObservationImage> getImageInfo(@PathVariable Long bookingId) {
        ObservationImage image = flatFieldService.getObservationImage(bookingId);
        if (image == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(image);
    }

    @GetMapping("/download/calibrated/{bookingId}")
    public ResponseEntity<Resource> downloadCalibratedImage(@PathVariable Long bookingId) {
        File file = flatFieldService.getCalibratedImageFile(bookingId);
        
        FileSystemResource resource = new FileSystemResource(file);
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"calibrated_image_" + bookingId + ".json\"")
                .body(resource);
    }

    @GetMapping("/status/{bookingId}")
    public ResponseEntity<Map<String, Object>> getImageStatus(@PathVariable Long bookingId) {
        Map<String, Object> status = new HashMap<>();
        ObservationImage image = flatFieldService.getObservationImage(bookingId);
        
        if (image != null) {
            status.put("ready", true);
            status.put("generatedAt", image.getGeneratedAt());
            status.put("skyBrightness", image.getAvgSkyBrightness());
            status.put("calibratedPath", image.getCalibratedImagePath());
        } else {
            status.put("ready", false);
            status.put("message", "图像尚未生成，请稍候");
        }
        
        return ResponseEntity.ok(status);
    }
}
