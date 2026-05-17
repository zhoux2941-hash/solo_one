package com.healthcare.service;

import com.healthcare.entity.User;
import com.healthcare.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    private Map<String, User> tokenStore = new HashMap<>();

    @PostConstruct
    public void init() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword("123456");
            admin.setRealName("系统管理员");
            admin.setRole("ADMIN");
            admin.setStatus(1);
            userRepository.save(admin);
        }
    }

    public Map<String, Object> login(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("用户不存在");
        }
        User user = userOpt.get();
        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("密码错误");
        }
        if (user.getStatus() != 1) {
            throw new RuntimeException("用户已被禁用");
        }
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, user);
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", user);
        return result;
    }

    public boolean validateToken(String token) {
        return tokenStore.containsKey(token);
    }

    public User getUserByToken(String token) {
        return tokenStore.get(token);
    }

    public void logout(String token) {
        tokenStore.remove(token);
    }
}