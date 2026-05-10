package com.construction.progress.controller;

import com.construction.progress.dto.ApiResponse;
import com.construction.progress.dto.CheckInDTO;
import com.construction.progress.security.JwtTokenProvider;
import com.construction.progress.service.CheckInService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/checkins")
public class CheckInController {

    private final CheckInService checkInService;
    private final JwtTokenProvider jwtTokenProvider;

    public CheckInController(CheckInService checkInService, JwtTokenProvider jwtTokenProvider) {
        this.checkInService = checkInService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCheckIn(
            @AuthenticationPrincipal Long workerId,
            @RequestHeader(value = "Authorization") String authorization,
            @Valid @RequestBody CheckInDTO checkInDTO) {
        try {
            String token = authorization.substring(7);
            String role = jwtTokenProvider.getRoleFromToken(token);
            
            if (!"WORKER".equals(role)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("只有施工员可以打卡"));
            }
            
            Map<String, Object> result = checkInService.createCheckIn(workerId, checkInDTO);
            return ResponseEntity.ok(ApiResponse.success("打卡成功", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProjectTimeline(@PathVariable Long projectId) {
        try {
            List<Map<String, Object>> timeline = checkInService.getProjectTimeline(projectId);
            return ResponseEntity.ok(ApiResponse.success(timeline));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyCheckIns(
            @AuthenticationPrincipal Long workerId,
            @RequestHeader(value = "Authorization") String authorization) {
        try {
            String token = authorization.substring(7);
            String role = jwtTokenProvider.getRoleFromToken(token);
            
            if (!"WORKER".equals(role)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("只有施工员可以查看自己的打卡记录"));
            }
            
            List<Map<String, Object>> checkIns = checkInService.getWorkerCheckIns(workerId);
            return ResponseEntity.ok(ApiResponse.success(checkIns));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
