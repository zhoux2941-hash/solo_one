package com.water.service;

import com.water.entity.User;
import com.water.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public Map<String, Object> login(String username, String password) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (!userOpt.isPresent()) {
            result.put("success", false);
            result.put("message", "用户不存在");
            return result;
        }
        
        User user = userOpt.get();
        if (!user.getEnabled()) {
            result.put("success", false);
            result.put("message", "账号已被禁用");
            return result;
        }
        
        if (!user.getPassword().equals(password)) {
            result.put("success", false);
            result.put("message", "密码错误");
            return result;
        }
        
        result.put("success", true);
        result.put("user", user);
        return result;
    }

    public Page<User> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return userRepository.findAll(pageable);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Map<String, Object> save(User user) {
        Map<String, Object> result = new HashMap<>();
        
        if (user.getId() == null) {
            if (userRepository.existsByUsername(user.getUsername())) {
                result.put("success", false);
                result.put("message", "用户名已存在");
                return result;
            }
            if (userRepository.existsByPhone(user.getPhone())) {
                result.put("success", false);
                result.put("message", "手机号已存在");
                return result;
            }
        } else {
            if (userRepository.existsByUsernameAndIdNot(user.getUsername(), user.getId())) {
                result.put("success", false);
                result.put("message", "用户名已存在");
                return result;
            }
            if (userRepository.existsByPhoneAndIdNot(user.getPhone(), user.getId())) {
                result.put("success", false);
                result.put("message", "手机号已存在");
                return result;
            }
        }
        
        User savedUser = userRepository.save(user);
        result.put("success", true);
        result.put("data", savedUser);
        return result;
    }

    public Map<String, Object> toggleEnabled(Long id) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> userOpt = userRepository.findById(id);
        
        if (!userOpt.isPresent()) {
            result.put("success", false);
            result.put("message", "用户不存在");
            return result;
        }
        
        User user = userOpt.get();
        user.setEnabled(!user.getEnabled());
        userRepository.save(user);
        
        result.put("success", true);
        result.put("message", "操作成功");
        return result;
    }

    public Map<String, Object> resetPassword(Long id, String newPassword) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> userOpt = userRepository.findById(id);
        
        if (!userOpt.isPresent()) {
            result.put("success", false);
            result.put("message", "用户不存在");
            return result;
        }
        
        User user = userOpt.get();
        user.setPassword(newPassword);
        userRepository.save(user);
        
        result.put("success", true);
        result.put("message", "密码重置成功");
        return result;
    }
}
