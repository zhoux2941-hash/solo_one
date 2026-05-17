package com.water.controller;

import com.water.entity.User;
import com.water.service.UserService;
import com.water.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public Map<String, Object> getUsers(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            String role = jwtUtil.getRoleFromToken(token);
            if (!"ADMIN".equals(role)) {
                result.put("success", false);
                result.put("message", "无权限访问");
                return result;
            }
            
            Page<User> userPage = userService.findAll(page, size);
            result.put("success", true);
            result.put("data", userPage.getContent());
            result.put("total", userPage.getTotalElements());
            result.put("totalPages", userPage.getTotalPages());
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "获取用户列表失败");
        }
        
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getUserById(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            String role = jwtUtil.getRoleFromToken(token);
            if (!"ADMIN".equals(role)) {
                result.put("success", false);
                result.put("message", "无权限访问");
                return result;
            }
            
            User user = userService.findById(id).orElse(null);
            if (user == null) {
                result.put("success", false);
                result.put("message", "用户不存在");
                return result;
            }
            
            result.put("success", true);
            result.put("data", user);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "获取用户信息失败");
        }
        
        return result;
    }

    @PostMapping
    public Map<String, Object> createUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody User user) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            String role = jwtUtil.getRoleFromToken(token);
            if (!"ADMIN".equals(role)) {
                result.put("success", false);
                result.put("message", "无权限访问");
                return result;
            }
            
            user.setId(null);
            return userService.save(user);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "创建用户失败");
        }
        
        return result;
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateUser(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody User user) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            String role = jwtUtil.getRoleFromToken(token);
            if (!"ADMIN".equals(role)) {
                result.put("success", false);
                result.put("message", "无权限访问");
                return result;
            }
            
            user.setId(id);
            return userService.save(user);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "更新用户失败");
        }
        
        return result;
    }

    @PutMapping("/{id}/toggle")
    public Map<String, Object> toggleUser(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            String role = jwtUtil.getRoleFromToken(token);
            if (!"ADMIN".equals(role)) {
                result.put("success", false);
                result.put("message", "无权限访问");
                return result;
            }
            
            return userService.toggleEnabled(id);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "操作失败");
        }
        
        return result;
    }

    @PutMapping("/{id}/reset-password")
    public Map<String, Object> resetPassword(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> passwordData) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            String role = jwtUtil.getRoleFromToken(token);
            if (!"ADMIN".equals(role)) {
                result.put("success", false);
                result.put("message", "无权限访问");
                return result;
            }
            
            String newPassword = passwordData.get("password");
            return userService.resetPassword(id, newPassword);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "重置密码失败");
        }
        
        return result;
    }
}
