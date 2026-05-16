package com.community.platform.controller;

import com.community.platform.dto.LoginRequest;
import com.community.platform.dto.RegisterRequest;
import com.community.platform.dto.Result;
import com.community.platform.entity.User;
import com.community.platform.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public Result<User> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.register(request);
            return Result.success("注册成功", user);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/login")
    public Result<User> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request);
            return Result.success("登录成功", user);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public Result<User> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return Result.success(user);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/recharge")
    public Result<User> recharge(@PathVariable Long id, @RequestBody java.util.Map<String, Object> request) {
        try {
            java.math.BigDecimal amount = new java.math.BigDecimal(request.get("amount").toString());
            User user = userService.updateBalance(id, amount);
            return Result.success("充值成功", user);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
