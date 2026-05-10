package com.example.chemical.controller;

import com.example.chemical.dto.LoginRequest;
import com.example.chemical.dto.Result;
import com.example.chemical.entity.User;
import com.example.chemical.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public Result<User> login(@RequestBody LoginRequest request, HttpSession session) {
        User user = userService.login(request.getUsername(), request.getPassword());
        if (user != null) {
            session.setAttribute("user", user);
            return Result.success(user);
        }
        return Result.error("Invalid username or password");
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpSession session) {
        session.invalidate();
        return Result.success();
    }

    @GetMapping("/current")
    public Result<User> getCurrentUser(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user != null) {
            return Result.success(user);
        }
        return Result.error(401, "Not logged in");
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody User user) {
        User created = userService.createUser(user);
        return Result.success(created);
    }
}
