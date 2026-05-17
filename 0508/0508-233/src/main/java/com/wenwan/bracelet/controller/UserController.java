package com.wenwan.bracelet.controller;

import com.wenwan.bracelet.entity.User;
import com.wenwan.bracelet.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginData) {
        String username = loginData.get("username");
        String password = loginData.get("password");
        User user = userService.login(username, password);
        Map<String, Object> response = new HashMap<>();
        if (user != null) {
            response.put("success", true);
            response.put("message", "登录成功");
            response.put("user", user);
        } else {
            response.put("success", false);
            response.put("message", "用户名或密码错误");
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody User user) {
        Map<String, Object> response = new HashMap<>();
        try {
            User newUser = userService.register(user);
            response.put("success", true);
            response.put("message", "注册成功");
            response.put("user", newUser);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.findById(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    @GetMapping("/craftsmen")
    public ResponseEntity<List<User>> getCraftsmen() {
        return ResponseEntity.ok(userService.findAllCraftsmen());
    }

    @GetMapping("/craftsmen/pending")
    public ResponseEntity<List<User>> getPendingCraftsmen() {
        return ResponseEntity.ok(userService.findPendingCraftsmen());
    }

    @GetMapping("/craftsmen/approved")
    public ResponseEntity<List<User>> getApprovedCraftsmen() {
        return ResponseEntity.ok(userService.findApprovedCraftsmen());
    }

    @PostMapping("/craftsmen/{id}/approve")
    public ResponseEntity<User> approveCraftsman(@PathVariable Long id) {
        User user = userService.approveCraftsman(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    @PostMapping("/craftsmen/{id}/reject")
    public ResponseEntity<User> rejectCraftsman(@PathVariable Long id) {
        User user = userService.rejectCraftsman(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userService.updateUser(id, userDetails);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    @GetMapping("/customers")
    public ResponseEntity<List<User>> getCustomers() {
        return ResponseEntity.ok(userService.findAllCustomers());
    }
}