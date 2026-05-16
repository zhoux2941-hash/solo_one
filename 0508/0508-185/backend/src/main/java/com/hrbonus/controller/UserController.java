package com.hrbonus.controller;

import com.hrbonus.entity.User;
import com.hrbonus.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<User> create(@RequestBody User user) {
        return ResponseEntity.ok(userRepository.save(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<User>> getByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(userRepository.findByDepartmentId(departmentId));
    }

    @GetMapping("/department/{departmentId}/employees")
    public ResponseEntity<List<User>> getEmployeesByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(userRepository.findByDepartmentIdAndRole(departmentId, User.Role.EMPLOYEE));
    }

    @GetMapping
    public ResponseEntity<List<User>> getAll() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
