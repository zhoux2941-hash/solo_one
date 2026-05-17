package com.construction.controller;

import com.construction.common.Result;
import com.construction.service.AuthService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Resource
    private AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> params, HttpSession session) {
        String username = params.get("username");
        String password = params.get("password");
        return authService.login(username, password, session);
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpSession session) {
        return authService.logout(session);
    }
}
