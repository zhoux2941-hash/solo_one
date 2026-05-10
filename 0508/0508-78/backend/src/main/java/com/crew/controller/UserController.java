package com.crew.controller;

import com.crew.entity.User;
import com.crew.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/actors")
    public ResponseEntity<?> getAllActors() {
        List<User> actors = userService.findAllActors();
        List<Map<String, Object>> result = actors.stream()
                .map(actor -> Map.of(
                    "id", actor.getId(),
                    "name", actor.getName(),
                    "username", actor.getUsername()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}