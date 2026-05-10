package com.volunteer.service;

import com.volunteer.entity.User;
import java.util.Optional;

public interface UserService {
    User register(String username, String password, String realName, String phone);
    Optional<User> login(String username, String password);
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    User update(User user);
}
