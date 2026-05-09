package com.exam.controller;

import com.exam.dto.ApiResponse;
import com.exam.entity.User;
import com.exam.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserRepository userRepository;
    
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @PostMapping("/login")
    public ApiResponse<User> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (password.equals(user.getPassword())) {
                return ApiResponse.success(user);
            }
        }
        
        return ApiResponse.error(401, "Invalid credentials");
    }
    
    @GetMapping("/students")
    public ApiResponse<List<User>> getStudents() {
        List<User> students = userRepository.findAll().stream()
                .filter(u -> "STUDENT".equals(u.getRole()))
                .toList();
        return ApiResponse.success(students);
    }
    
    @GetMapping("/teachers")
    public ApiResponse<List<User>> getTeachers() {
        List<User> teachers = userRepository.findAll().stream()
                .filter(u -> "TEACHER".equals(u.getRole()))
                .toList();
        return ApiResponse.success(teachers);
    }
    
    @GetMapping("/{userId}")
    public ApiResponse<User> getUser(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(ApiResponse::success)
                .orElse(ApiResponse.error(404, "User not found"));
    }
}
