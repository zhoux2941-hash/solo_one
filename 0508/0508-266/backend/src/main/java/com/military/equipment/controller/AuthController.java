package com.military.equipment.controller;

import com.military.equipment.common.Result;
import com.military.equipment.dto.LoginDTO;
import com.military.equipment.service.AuthService;
import com.military.equipment.vo.LoginVO;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Resource
    private AuthService authService;

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
        return Result.success(authService.login(dto));
    }
}
