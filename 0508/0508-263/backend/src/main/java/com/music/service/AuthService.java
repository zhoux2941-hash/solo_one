package com.music.service;

import com.music.config.JwtUtil;
import com.music.dto.*;
import com.music.entity.User;
import com.music.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    public ApiResponse<LoginResponse> login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElse(null);

        if (user == null) {
            user = userRepository.findByEmail(request.getUsername()).orElse(null);
        }

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ApiResponse.error("用户名或密码错误");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole());
        LoginResponse response = new LoginResponse(token, UserDTO.fromEntity(user));

        return ApiResponse.success("登录成功", response);
    }

    @Transactional
    public ApiResponse<UserDTO> register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ApiResponse.error("用户名已存在");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ApiResponse.error("邮箱已被注册");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setRole("USER");

        user = userRepository.save(user);

        return ApiResponse.success("注册成功", UserDTO.fromEntity(user));
    }

    public ApiResponse<UserDTO> getCurrentUser(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.error("用户不存在");
        }
        return ApiResponse.success(UserDTO.fromEntity(user));
    }
}
