package com.festival.volunteer.controller;

import com.festival.volunteer.dto.ApiResponse;
import com.festival.volunteer.dto.LoginRequest;
import com.festival.volunteer.dto.LoginResponse;
import com.festival.volunteer.dto.RegisterRequest;
import com.festival.volunteer.entity.User;
import com.festival.volunteer.service.AuthService;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostConstruct
    public void init() {
        authService.initDefaultUsers();
    }

    @PostMapping("/register")
    public ApiResponse<User> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = authService.register(request);
            user.setPassword(null);
            return ApiResponse.success("注册成功", user);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ApiResponse.success("登录成功", response);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
