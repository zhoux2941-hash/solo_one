package com.lab.reagent.controller;

import com.lab.reagent.common.Result;
import com.lab.reagent.entity.User;
import com.lab.reagent.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");

        if (username == null || password == null) {
            return Result.error("用户名和密码不能为空");
        }

        User user = userService.login(username, password);
        if (user == null) {
            return Result.error("用户名或密码错误");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("name", user.getName());
        data.put("role", user.getRole());
        data.put("department", user.getDepartment());
        data.put("phone", user.getPhone());

        return Result.success(data);
    }

    @GetMapping("/teachers")
    public Result<List<User>> getTeachers() {
        return Result.success(userService.getAllTeachers());
    }

    @GetMapping("/all")
    public Result<List<User>> getAll() {
        return Result.success(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public Result<User> getById(@PathVariable Long id) {
        return Result.success(userService.getById(id));
    }
}
