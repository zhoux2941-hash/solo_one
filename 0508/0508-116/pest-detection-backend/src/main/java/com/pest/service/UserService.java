package com.pest.service;

import com.pest.dto.LoginRequest;
import com.pest.dto.RegisterRequest;
import com.pest.entity.User;
import com.pest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("手机号已注册");
        }

        User user = new User();
        user.setPhone(request.getPhone());
        user.setPassword(request.getPassword());
        user.setName(request.getName());
        user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));

        return userRepository.save(user);
    }

    public User login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByPhone(request.getPhone());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("用户不存在");
        }

        User user = userOpt.get();
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        return user;
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
}