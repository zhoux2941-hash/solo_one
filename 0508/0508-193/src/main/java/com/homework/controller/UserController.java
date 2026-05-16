package com.homework.controller;

import com.homework.entity.User;
import com.homework.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");
        
        Optional<User> user = userService.login(username, password);
        if (user.isPresent()) {
            Map<String, Object> result = new HashMap<>();
            result.put("id", user.get().getId());
            result.put("username", user.get().getUsername());
            result.put("name", user.get().getName());
            result.put("role", user.get().getRole());
            result.put("className", user.get().getClassName());
            return ResponseEntity.ok(result);
        }
        
        return ResponseEntity.badRequest().body(Map.of("message", "用户名或密码错误"));
    }

    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents() {
        return ResponseEntity.ok(userService.getAllStudents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.findById(id);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
