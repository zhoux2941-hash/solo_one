package com.scenic.controller;

import com.scenic.dto.LoginRequest;
import com.scenic.dto.Result;
import com.scenic.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, Object> result = authService.login(request.getUsername(), request.getPassword());
        if ((Boolean) result.get("success")) {
            return Result.success("登录成功", result);
        } else {
            return Result.error(400, (String) result.get("message"));
        }
    }

    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        authService.logout(token);
        return Result.success("退出成功", null);
    }
}
