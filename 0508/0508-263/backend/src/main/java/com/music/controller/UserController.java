package com.music.controller;

import com.music.config.JwtUtil;
import com.music.dto.ApiResponse;
import com.music.dto.MusicDTO;
import com.music.dto.UserDTO;
import com.music.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> getProfile(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<UserDTO> response = userService.getUserProfile(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<ApiResponse<UserDTO>> getUserProfile(@PathVariable Long id) {
        ApiResponse<UserDTO> response = userService.getUserProfile(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<MusicDTO>>> getPlayHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "50") int limit) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<List<MusicDTO>> response = userService.getPlayHistory(userId, limit);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String bio) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<UserDTO> response = userService.updateProfile(userId, nickname, bio);
        return ResponseEntity.ok(response);
    }
}
