package com.factory.service;

import com.factory.common.Result;
import com.factory.entity.User;
import com.factory.repository.UserRepository;
import com.factory.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    public Result<Map<String, Object>> login(String username, String password) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        
        if (!userOptional.isPresent()) {
            return Result.error("用户不存在");
        }

        User user = userOptional.get();
        
        if (!user.getEnabled()) {
            return Result.error("用户已被禁用");
        }

        if (!user.getPassword().equals(password)) {
            return Result.error("密码错误");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole());
        
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userId", user.getId());
        data.put("username", user.getUsername());
        data.put("realName", user.getRealName());
        data.put("role", user.getRole());

        return Result.success(data);
    }

    public Result<User> register(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            return Result.error("用户名已存在");
        }
        
        user.setRole("USER");
        user.setEnabled(true);
        User savedUser = userRepository.save(user);
        return Result.success(savedUser);
    }
}