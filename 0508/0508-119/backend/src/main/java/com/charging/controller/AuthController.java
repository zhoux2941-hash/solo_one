package com.charging.controller;

import com.charging.common.ResponseResult;
import com.charging.dto.LoginRequest;
import com.charging.dto.RegisterRequest;
import com.charging.entity.User;
import com.charging.service.AuthService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    public ResponseResult<Map<String, Object>> login(@RequestBody LoginRequest request) {
        try {
            Map<String, Object> result = authService.login(request);
            User user = (User) result.get("user");
            user.setPassword(null);
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", result.get("token"));
            response.put("user", user);
            
            return ResponseResult.success(response);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @PostMapping("/register")
    public ResponseResult<User> register(@RequestBody RegisterRequest request) {
        try {
            User user = authService.register(request);
            user.setPassword(null);
            return ResponseResult.success(user);
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @GetMapping("/me")
    public ResponseResult<User> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseResult.error(401, "未登录");
        }
        
        String token = authHeader.substring(7);
        Claims claims = authService.parseToken(token);
        
        if (claims == null) {
            return ResponseResult.error(401, "Token无效");
        }
        
        Long userId = claims.get("userId", Long.class);
        User user = authService.getUserById(userId);
        
        if (user == null) {
            return ResponseResult.error(401, "用户不存在");
        }
        
        user.setPassword(null);
        return ResponseResult.success(user);
    }
}
