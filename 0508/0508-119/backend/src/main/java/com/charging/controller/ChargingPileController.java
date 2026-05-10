package com.charging.controller;

import com.charging.common.ResponseResult;
import com.charging.entity.ChargingPile;
import com.charging.entity.PileStatus;
import com.charging.service.AuthService;
import com.charging.service.ChargingPileService;
import com.charging.service.ReservationService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/charging-piles")
@RequiredArgsConstructor
public class ChargingPileController {
    
    private final ChargingPileService chargingPileService;
    private final ReservationService reservationService;
    private final AuthService authService;
    
    @GetMapping("/public/list")
    public ResponseResult<List<ChargingPile>> getAllPiles() {
        return ResponseResult.success(chargingPileService.getAllPiles());
    }
    
    @GetMapping("/public/{id}")
    public ResponseResult<ChargingPile> getPileById(@PathVariable Long id) {
        return chargingPileService.getPileById(id)
                .map(ResponseResult::success)
                .orElse(ResponseResult.error("充电桩不存在"));
    }
    
    @GetMapping("/public/code/{code}")
    public ResponseResult<ChargingPile> getPileByCode(@PathVariable String code) {
        return chargingPileService.getPileByCode(code)
                .map(ResponseResult::success)
                .orElse(ResponseResult.error("充电桩不存在"));
    }
    
    @GetMapping("/public/status/{id}")
    public ResponseResult<Map<String, Object>> getPileStatus(@PathVariable Long id) {
        try {
            PileStatus status = chargingPileService.getPileStatus(id);
            Map<String, Object> result = new HashMap<>();
            result.put("status", status);
            result.put("availableTimeSlots", reservationService.getAvailableTimeSlots(id));
            return ResponseResult.success(result);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @GetMapping("/public/available-slots/{id}")
    public ResponseResult<List<LocalDateTime>> getAvailableSlots(@PathVariable Long id) {
        return ResponseResult.success(reservationService.getAvailableTimeSlots(id));
    }
    
    @PostMapping
    public ResponseResult<ChargingPile> createPile(
            @RequestBody ChargingPile pile,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权操作");
        }
        
        try {
            return ResponseResult.success(chargingPileService.createPile(pile));
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ResponseResult<ChargingPile> updatePile(
            @PathVariable Long id,
            @RequestBody ChargingPile pile,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权操作");
        }
        
        try {
            return ResponseResult.success(chargingPileService.updatePile(id, pile));
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}/status/{status}")
    public ResponseResult<ChargingPile> updatePileStatus(
            @PathVariable Long id,
            @PathVariable PileStatus status,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权操作");
        }
        
        try {
            return ResponseResult.success(chargingPileService.updatePileStatus(id, status));
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseResult<Void> deletePile(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权操作");
        }
        
        try {
            chargingPileService.deletePile(id);
            return ResponseResult.success();
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        
        String token = authHeader.substring(7);
        Claims claims = authService.parseToken(token);
        
        if (claims == null) {
            return false;
        }
        
        String role = claims.get("role", String.class);
        return "ADMIN".equals(role);
    }
}
