package com.water.controller;

import com.water.entity.User;
import com.water.service.UserService;
import com.water.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> loginData) {
        String username = loginData.get("username");
        String password = loginData.get("password");
        
        Map<String, Object> loginResult = userService.login(username, password);
        
        if (!(Boolean) loginResult.get("success")) {
            return loginResult;
        }
        
        User user = (User) loginResult.get("user");
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("token", token);
        result.put("user", buildUserInfo(user));
        return result;
    }

    @GetMapping("/info")
    public Map<String, Object> getUserInfo(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            String username = jwtUtil.getUsernameFromToken(token);
            User user = userService.findByUsername(username).orElse(null);
            
            if (user == null) {
                result.put("success", false);
                result.put("message", "用户不存在");
                return result;
            }
            
            result.put("success", true);
            result.put("user", buildUserInfo(user));
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "获取用户信息失败");
        }
        
        return result;
    }

    private Map<String, Object> buildUserInfo(User user) {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("realName", user.getRealName());
        userInfo.put("phone", user.getPhone());
        userInfo.put("role", user.getRole());
        return userInfo;
    }
}
