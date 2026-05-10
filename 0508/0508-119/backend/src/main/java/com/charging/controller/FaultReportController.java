package com.charging.controller;

import com.charging.common.ResponseResult;
import com.charging.dto.FaultReportRequest;
import com.charging.entity.FaultReport;
import com.charging.entity.FaultReportStatus;
import com.charging.service.AuthService;
import com.charging.service.FaultReportService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fault-reports")
@RequiredArgsConstructor
public class FaultReportController {
    
    private final FaultReportService faultReportService;
    private final AuthService authService;
    
    @GetMapping
    public ResponseResult<List<FaultReport>> getAllReports(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) FaultReportStatus status) {
        
        if (!isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权查看");
        }
        
        if (status != null) {
            return ResponseResult.success(faultReportService.getReportsByStatus(status));
        }
        
        return ResponseResult.success(faultReportService.getAllReports());
    }
    
    @GetMapping("/my")
    public ResponseResult<List<FaultReport>> getMyReports(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseResult.error(401, "未登录");
        }
        
        return ResponseResult.success(faultReportService.getMyReports(userId));
    }
    
    @GetMapping("/{id}")
    public ResponseResult<FaultReport> getReportById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseResult.error(401, "未登录");
        }
        
        return faultReportService.getReportById(id)
                .map(r -> {
                    if (!r.getReporterId().equals(userId) && !isAdmin(authHeader)) {
                        return ResponseResult.<FaultReport>error(403, "无权查看");
                    }
                    return ResponseResult.success(r);
                })
                .orElse(ResponseResult.error("故障报告不存在"));
    }
    
    @PostMapping
    public ResponseResult<FaultReport> createReport(
            @RequestBody FaultReportRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseResult.error(401, "未登录");
        }
        
        try {
            FaultReport report = faultReportService.createReport(userId, request);
            return ResponseResult.success(report);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}/process")
    public ResponseResult<FaultReport> processReport(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null || !isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权操作");
        }
        
        try {
            FaultReport report = faultReportService.processReport(id, userId);
            return ResponseResult.success(report);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}/resolve")
    public ResponseResult<FaultReport> resolveReport(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null || !isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权操作");
        }
        
        try {
            String handleNote = body.getOrDefault("handleNote", "");
            FaultReport report = faultReportService.resolveReport(id, userId, handleNote);
            return ResponseResult.success(report);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}/reject")
    public ResponseResult<FaultReport> rejectReport(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null || !isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权操作");
        }
        
        try {
            String handleNote = body.getOrDefault("handleNote", "");
            FaultReport report = faultReportService.rejectReport(id, userId, handleNote);
            return ResponseResult.success(report);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authHeader.substring(7);
        Claims claims = authService.parseToken(token);
        
        if (claims == null) {
            return null;
        }
        
        return claims.get("userId", Long.class);
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
