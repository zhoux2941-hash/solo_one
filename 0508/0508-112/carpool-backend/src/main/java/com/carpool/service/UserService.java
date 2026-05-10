package com.carpool.service;

import com.carpool.dto.AuthDTO;
import com.carpool.entity.User;
import com.carpool.repository.UserRepository;
import com.carpool.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }

        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("手机号已被注册");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRealName(request.getRealName());
        user.setPhone(request.getPhone());
        user.setCreditScore(100);
        user.setCompletedRides(0);
        user.setCanceledRides(0);

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getUsername());

        return new AuthDTO.AuthResponse(
            token,
            savedUser.getId(),
            savedUser.getUsername(),
            savedUser.getRealName(),
            savedUser.getCreditScore()
        );
    }

    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        return new AuthDTO.AuthResponse(
            token,
            user.getId(),
            user.getUsername(),
            user.getRealName(),
            user.getCreditScore()
        );
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
    }

    @Transactional
    public void increaseCreditScore(Long userId, int points) {
        User user = getUserById(userId);
        user.setCreditScore(user.getCreditScore() + points);
        user.setCompletedRides(user.getCompletedRides() + 1);
        userRepository.save(user);
    }

    @Transactional
    public void decreaseCreditScore(Long userId, int points) {
        User user = getUserById(userId);
        int newScore = Math.max(0, user.getCreditScore() - points);
        user.setCreditScore(newScore);
        user.setCanceledRides(user.getCanceledRides() + 1);
        userRepository.save(user);
    }
}
