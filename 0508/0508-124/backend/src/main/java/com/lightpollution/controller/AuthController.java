package com.lightpollution.controller;

import com.lightpollution.dto.ApiResponse;
import com.lightpollution.dto.LoginRequest;
import com.lightpollution.dto.RegisterRequest;
import com.lightpollution.security.JwtTokenProvider;
import com.lightpollution.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            Map<String, Object> result = authService.register(request);
            return ResponseEntity.ok(ApiResponse.success("注册成功", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody LoginRequest request) {
        try {
            Map<String, Object> result = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success("登录成功", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("用户名或密码错误"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(ApiResponse.error("未登录"));
            }
            String token = authHeader.substring(7);
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            Map<String, Object> user = authService.getCurrentUser(userId);
            return ResponseEntity.ok(ApiResponse.success(user));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(ApiResponse.error("Token无效或已过期"));
        }
    }
}
