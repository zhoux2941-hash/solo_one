package com.music.controller;

import com.music.config.JwtUtil;
import com.music.dto.ApiResponse;
import com.music.entity.ShareLink;
import com.music.service.ShareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shares")
public class ShareController {

    @Autowired
    private ShareService shareService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> createShareLink(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String targetType,
            @RequestParam Long targetId,
            @RequestParam(defaultValue = "24") Integer expireHours) {

        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<String> response = shareService.createShareLink(userId, targetType, targetId, expireHours);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{shareCode}")
    public ResponseEntity<ApiResponse<ShareLink>> getShareTarget(@PathVariable String shareCode) {
        ApiResponse<ShareLink> response = shareService.getShareTarget(shareCode);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShareLink>>> getUserShareLinks(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<List<ShareLink>> response = shareService.getUserShareLinks(userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteShareLink(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<String> response = shareService.deleteShareLink(userId, id);
        return ResponseEntity.ok(response);
    }
}
