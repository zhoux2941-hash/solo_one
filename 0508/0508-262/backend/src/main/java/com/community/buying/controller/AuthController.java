package com.community.buying.controller;

import com.community.buying.common.Result;
import com.community.buying.dto.LoginRequest;
import com.community.buying.dto.LoginResponse;
import com.community.buying.entity.User;
import com.community.buying.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = userService.login(request);
            return Result.success("登录成功", response);
        } catch (Exception e) {
            return Result.error("用户名或密码错误");
        }
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody User user, @RequestParam(defaultValue = "USER") String roleCode) {
        try {
            User savedUser = userService.register(user, roleCode);
            savedUser.setPassword(null);
            return Result.success("注册成功", savedUser);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}