package com.exam.service;

import com.exam.entity.User;
import com.exam.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void initDefaultUser() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword("admin123");
            admin.setName("管理员");
            admin.setRole(User.Role.ADMIN);
            userRepository.save(admin);
        }

        if (!userRepository.existsByUsername("user1")) {
            User user = new User();
            user.setUsername("user1");
            user.setPassword("123456");
            user.setName("测试考生");
            user.setDepartment("技术部");
            user.setRole(User.Role.EXAMINEE);
            userRepository.save(user);
        }
    }

    public User login(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(password)) {
                return user;
            }
        }
        return null;
    }

    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
