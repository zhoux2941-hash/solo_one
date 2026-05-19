package com.community.buying.service;

import com.community.buying.dto.LoginRequest;
import com.community.buying.dto.LoginResponse;
import com.community.buying.entity.Role;
import com.community.buying.entity.User;
import com.community.buying.repository.RoleRepository;
import com.community.buying.repository.UserRepository;
import com.community.buying.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        final String jwt = jwtUtil.generateToken(userDetails);

        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        String role = user.getRoles().isEmpty() ? "" : user.getRoles().iterator().next().getRoleCode();

        return new LoginResponse(jwt, "Bearer", user.getId(), user.getUsername(), user.getNickname(), role);
    }

    public User register(User user, String roleCode) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        Role role = roleRepository.findByRoleCode(roleCode)
                .orElseThrow(() -> new RuntimeException("角色不存在"));

        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        return userRepository.save(user);
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User update(User user) {
        return userRepository.save(user);
    }
}