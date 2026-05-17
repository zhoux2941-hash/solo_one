package com.scenic.service;

import com.scenic.entity.User;
import com.scenic.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public Map<String, Object> login(String username, String password) {
        Map<String, Object> result = new HashMap<>();

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            result.put("success", false);
            result.put("message", "用户不存在");
            return result;
        }

        if (!user.getStatus()) {
            result.put("success", false);
            result.put("message", "用户已被禁用");
            return result;
        }

        if (!user.getPassword().equals(password)) {
            result.put("success", false);
            result.put("message", "密码错误");
            return result;
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        user.setToken(token);
        user.setTokenExpireTime(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        result.put("success", true);
        result.put("token", token);
        result.put("username", user.getUsername());
        result.put("role", user.getRole());
        if (user.getEmployee() != null) {
            result.put("empName", user.getEmployee().getName());
        }

        return result;
    }

    public boolean validateToken(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }

        User user = userRepository.findByToken(token).orElse(null);
        if (user == null) {
            return false;
        }

        if (user.getTokenExpireTime() == null || user.getTokenExpireTime().isBefore(LocalDateTime.now())) {
            return false;
        }

        return true;
    }

    public User getUserByToken(String token) {
        return userRepository.findByToken(token).orElse(null);
    }

    public void logout(String token) {
        User user = userRepository.findByToken(token).orElse(null);
        if (user != null) {
            user.setToken(null);
            user.setTokenExpireTime(null);
            userRepository.save(user);
        }
    }
}
