package com.factory.controller;

import com.factory.common.Result;
import com.factory.entity.User;
import com.factory.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");
        return authService.login(username, password);
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody User user) {
        return authService.register(user);
    }
}