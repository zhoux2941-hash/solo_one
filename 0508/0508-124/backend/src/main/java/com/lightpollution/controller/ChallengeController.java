package com.lightpollution.controller;

import com.lightpollution.dto.ApiResponse;
import com.lightpollution.dto.ObservationRequest;
import com.lightpollution.entity.Challenge;
import com.lightpollution.security.JwtTokenProvider;
import com.lightpollution.service.ChallengeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/challenges")
@Validated
public class ChallengeController {

    @Autowired
    private ChallengeService challengeService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startChallenge(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, BigDecimal> location) {
        try {
            Long userId = extractUserId(authHeader);
            BigDecimal latitude = location.get("latitude");
            BigDecimal longitude = location.get("longitude");
            
            if (latitude == null || longitude == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("请提供经纬度"));
            }

            Map<String, Object> result = challengeService.startChallenge(userId, latitude, longitude);
            return ResponseEntity.ok(ApiResponse.success("挑战已开始", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/checkin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkIn(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ObservationRequest request) {
        try {
            Long userId = extractUserId(authHeader);
            Map<String, Object> result = challengeService.checkIn(userId, request);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserChallenges(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        List<Map<String, Object>> challenges = challengeService.getUserChallenges(userId);
        return ResponseEntity.ok(ApiResponse.success(challenges));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getActiveChallenge(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        Optional<Challenge> active = challengeService.getActiveChallenge(userId);
        
        if (active.isPresent()) {
            Map<String, Object> result = new HashMap<>();
            Challenge c = active.get();
            result.put("id", c.getId());
            result.put("startDate", c.getStartDate());
            result.put("latitude", c.getLatitude());
            result.put("longitude", c.getLongitude());
            result.put("streakDays", c.getStreakDays());
            result.put("totalDays", 7);
            return ResponseEntity.ok(ApiResponse.success(result));
        }
        
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private Long extractUserId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("未授权");
    }
}
