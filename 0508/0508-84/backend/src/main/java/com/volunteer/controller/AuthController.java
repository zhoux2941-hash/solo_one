package com.volunteer.controller;

import com.volunteer.config.CommonResult;
import com.volunteer.entity.User;
import com.volunteer.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public CommonResult<User> register(@RequestBody Map<String, String> params) {
        try {
            User user = userService.register(
                params.get("username"),
                params.get("password"),
                params.get("realName"),
                params.get("phone")
            );
            user.setPassword(null);
            return CommonResult.success("注册成功", user);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PostMapping("/login")
    public CommonResult<Map<String, Object>> login(@RequestBody Map<String, String> params) {
        try {
            String username = params.get("username");
            String password = params.get("password");
            Optional<User> userOpt = userService.login(username, password);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Map<String, Object> result = new HashMap<>();
                user.setPassword(null);
                result.put("user", user);
                result.put("token", "mock-token-" + user.getId());
                return CommonResult.success("登录成功", result);
            } else {
                return CommonResult.error("用户名或密码错误");
            }
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @GetMapping("/user/{id}")
    public CommonResult<User> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userService.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(null);
            return CommonResult.success(user);
        }
        return CommonResult.error("用户不存在");
    }
}
