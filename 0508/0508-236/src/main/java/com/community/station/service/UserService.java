package com.community.station.service;

import com.community.station.entity.User;
import com.community.station.repository.UserRepository;
import com.community.station.util.PhoneUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Page<User> getUsersByPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return userRepository.findAll(pageable);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        if (StringUtils.hasText(user.getPhone())) {
            if (!PhoneUtils.isValidMobile(user.getPhone())) {
                throw new RuntimeException("手机号格式不正确，请输入11位有效手机号");
            }
            user.setPhone(PhoneUtils.cleanPhone(user.getPhone()));
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));

        user.setRealName(userDetails.getRealName());
        if (StringUtils.hasText(userDetails.getPhone())) {
            if (!PhoneUtils.isValidMobile(userDetails.getPhone())) {
                throw new RuntimeException("手机号格式不正确，请输入11位有效手机号");
            }
            user.setPhone(PhoneUtils.cleanPhone(userDetails.getPhone()));
        } else {
            user.setPhone(null);
        }
        user.setRole(userDetails.getRole());
        user.setEnabled(userDetails.getEnabled());

        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setEnabled(!user.getEnabled());
        return userRepository.save(user);
    }
}
