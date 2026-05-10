package com.meteor.controller;

import com.meteor.dto.VelocityEstimateRequest;
import com.meteor.dto.VelocityEstimateResponse;
import com.meteor.service.VelocityEstimationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/velocity")
public class VelocityController {
    
    private final VelocityEstimationService velocityService;
    
    public VelocityController(VelocityEstimationService velocityService) {
        this.velocityService = velocityService;
    }
    
    @PostMapping("/estimate")
    public ResponseEntity<?> estimateVelocity(@RequestBody VelocityEstimateRequest request) {
        try {
            VelocityEstimateResponse response = velocityService.estimateVelocity(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    
    @GetMapping("/presets")
    public ResponseEntity<?> getPresets() {
        return ResponseEntity.ok(new CameraPresets());
    }
    
    public static class CameraPresets {
        public String[] commonFov = {"30° (广角镜头)", "50° (标准镜头)", "90° (鱼眼镜头)", "120° (超广角)"};
        public String[] commonFps = {"25 FPS (PAL)", "30 FPS (NTSC)", "60 FPS", "100 FPS", "200 FPS"};
        public double defaultHeight = 100.0;
        public double minHeight = 70.0;
        public double maxHeight = 130.0;
        public String description = "流星通常出现在70-130公里高度，默认假设100公里";
    }
}
