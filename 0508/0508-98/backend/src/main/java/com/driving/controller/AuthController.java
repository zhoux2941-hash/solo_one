package com.driving.controller;

import com.driving.common.Result;
import com.driving.dto.LoginDTO;
import com.driving.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody @Validated LoginDTO loginDTO) {
        Map<String, Object> result = authService.login(loginDTO);
        return Result.success(result);
    }
}