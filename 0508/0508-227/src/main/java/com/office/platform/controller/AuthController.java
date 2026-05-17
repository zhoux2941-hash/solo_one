package com.office.platform.controller;

import com.office.platform.common.LoginUser;
import com.office.platform.common.Result;
import com.office.platform.dto.LoginDTO;
import com.office.platform.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Result<LoginUser> login(@Validated @RequestBody LoginDTO loginDTO, HttpSession session) {
        return authService.login(loginDTO, session);
    }

    @PostMapping("/logout")
    public Result<String> logout(HttpSession session) {
        return authService.logout(session);
    }

    @GetMapping("/current")
    public Result<LoginUser> getCurrentUser(HttpSession session) {
        return authService.getCurrentUser(session);
    }
}