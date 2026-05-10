package com.blindbox.exchange.controller;

import com.blindbox.exchange.dto.ApiResponse;
import com.blindbox.exchange.entity.BlindBox;
import com.blindbox.exchange.security.JwtTokenProvider;
import com.blindbox.exchange.service.BrowseHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class BrowseHistoryController {

    private final BrowseHistoryService browseHistoryService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getCurrentUserId(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return jwtTokenProvider.getUserIdFromJWT(token.substring(7));
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BlindBox>>> getBrowseHistory(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        List<BlindBox> history = browseHistoryService.getBrowseHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearHistory(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        browseHistoryService.clearHistory(userId);
        return ResponseEntity.ok(ApiResponse.success("已清除浏览历史", null));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<BlindBox>>> getRecommendations(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        List<BlindBox> recommendations = browseHistoryService.getRecommendations(userId);
        return ResponseEntity.ok(ApiResponse.success(recommendations));
    }
}
