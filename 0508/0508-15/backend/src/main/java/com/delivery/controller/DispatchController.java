package com.delivery.controller;

import com.delivery.dto.RiderLocationDTO;
import com.delivery.service.RiskCacheService;
import com.delivery.service.RiskPrecomputeService;
import com.delivery.service.RiskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispatch")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DispatchController {

    private final RiskCacheService riskCacheService;
    private final RiskPrecomputeService riskPrecomputeService;
    private final RiskService riskService;

    @GetMapping("/riders")
    public ResponseEntity<List<RiderLocationDTO>> getActiveRiders() {
        List<RiderLocationDTO> cachedData = riskCacheService.getCachedRiskData();
        
        if (!cachedData.isEmpty()) {
            log.debug("Returning cached risk data: {} entries", cachedData.size());
            return ResponseEntity.ok(cachedData);
        }

        log.warn("No cache available, triggering precompute as fallback");
        riskPrecomputeService.triggerImmediatePrecompute();
        List<RiderLocationDTO> fallbackData = riskCacheService.getCachedRiskData();
        
        if (!fallbackData.isEmpty()) {
            return ResponseEntity.ok(fallbackData);
        }

        log.warn("Precompute returned empty, using realtime calculation as last fallback");
        return ResponseEntity.ok(riskService.getActiveRidersWithRisk());
    }

    @PostMapping("/precompute")
    public ResponseEntity<Void> triggerPrecompute() {
        riskPrecomputeService.triggerImmediatePrecompute();
        return ResponseEntity.ok().build();
    }
}
