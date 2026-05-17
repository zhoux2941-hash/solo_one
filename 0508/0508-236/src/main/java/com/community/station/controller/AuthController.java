package com.community.station.controller;

import com.community.station.entity.User;
import com.community.station.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            User user = userService.getUserByUsername(auth.getName()).orElse(null);
            if (user != null) {
                Map<String, Object> result = new HashMap<>();
                result.put("id", user.getId());
                result.put("username", user.getUsername());
                result.put("realName", user.getRealName());
                result.put("role", user.getRole().name());
                result.put("phone", user.getPhone());
                return ResponseEntity.ok(result);
            }
        }
        return ResponseEntity.notFound().build();
    }
}
