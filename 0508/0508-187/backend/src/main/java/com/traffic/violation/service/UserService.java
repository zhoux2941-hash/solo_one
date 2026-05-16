package com.traffic.violation.service;

import com.traffic.violation.entity.User;
import com.traffic.violation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User login(String username, String password) {
        Optional<User> user = userRepository.findByUsernameAndPassword(username, password);
        return user.orElse(null);
    }

    public User getUserByPlateNumber(String plateNumber) {
        Optional<User> user = userRepository.findByPlateNumber(plateNumber);
        return user.orElse(null);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }
}
