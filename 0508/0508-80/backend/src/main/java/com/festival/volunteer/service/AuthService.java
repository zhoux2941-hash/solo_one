package com.festival.volunteer.service;

import com.festival.volunteer.dto.LoginRequest;
import com.festival.volunteer.dto.LoginResponse;
import com.festival.volunteer.dto.RegisterRequest;
import com.festival.volunteer.entity.User;
import com.festival.volunteer.repository.UserRepository;
import com.festival.volunteer.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        user.setRole(User.Role.VOLUNTEER);
        user.setAvailableTime(request.getAvailableTime());
        user.setSkills(request.getSkills());

        return userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        String token = jwtTokenProvider.generateToken(
            user.getUsername(),
            user.getRole().name(),
            user.getId()
        );

        return new LoginResponse(token, user.getId(), user.getUsername(), user.getName(), user.getRole());
    }

    @Transactional
    public void initDefaultUsers() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setName("系统管理员");
            admin.setRole(User.Role.ADMIN);
            admin.setPhone("13800000000");
            admin.setEmail("admin@festival.com");
            userRepository.save(admin);
        }

        if (!userRepository.existsByUsername("leader")) {
            User leader = new User();
            leader.setUsername("leader");
            leader.setPassword(passwordEncoder.encode("leader123"));
            leader.setName("志愿者组长");
            leader.setRole(User.Role.LEADER);
            leader.setPhone("13800000001");
            leader.setEmail("leader@festival.com");
            userRepository.save(leader);
        }
    }
}
