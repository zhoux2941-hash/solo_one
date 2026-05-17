package com.logistics.park.service;

import com.logistics.park.dto.LoginRequest;
import com.logistics.park.entity.Role;
import com.logistics.park.entity.User;
import com.logistics.park.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByPhone(request.getPhone());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getEnabled() && passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return user;
            }
        }
        return null;
    }

    @Transactional
    public User createUser(User user) {
        if (userRepository.existsByPhone(user.getPhone())) {
            throw new RuntimeException("手机号已存在");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, User user) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        if (!existingUser.getPhone().equals(user.getPhone()) 
                && userRepository.existsByPhone(user.getPhone())) {
            throw new RuntimeException("手机号已存在");
        }
        
        existingUser.setPhone(user.getPhone());
        existingUser.setName(user.getName());
        existingUser.setRole(user.getRole());
        
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        
        return userRepository.save(existingUser);
    }

    @Transactional
    public void toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setEnabled(!user.getEnabled());
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public Page<User> getUsers(int page, int size, Role role, String name) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        
        if (role != null && name != null && !name.isEmpty()) {
            return userRepository.findByRoleAndNameContaining(role, name, pageable);
        } else if (role != null) {
            return userRepository.findByRole(role, pageable);
        } else if (name != null && !name.isEmpty()) {
            return userRepository.findByNameContaining(name, pageable);
        }
        return userRepository.findAll(pageable);
    }

    public boolean existsByPhone(String phone) {
        return userRepository.existsByPhone(phone);
    }
}
