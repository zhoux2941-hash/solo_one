package com.dorm.bill.controller;

import com.dorm.bill.common.Result;
import com.dorm.bill.common.UserContext;
import com.dorm.bill.dto.LoginRequest;
import com.dorm.bill.dto.RegisterRequest;
import com.dorm.bill.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public Result<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        try {
            return Result.success(userService.register(request));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest request) {
        try {
            return Result.success(userService.login(request));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/me")
    public Result<Map<String, Object>> getCurrentUser() {
        try {
            Long userId = UserContext.getUserId();
            return Result.success(userService.getCurrentUserInfo(userId));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
