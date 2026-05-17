package com.office.platform.controller;

import com.office.platform.common.Result;
import com.office.platform.dto.UserDTO;
import com.office.platform.entity.User;
import com.office.platform.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public Result<Page<User>> getUserList(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String realName,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<User> userPage = userService.getUserList(username, realName, departmentId, page, size);
        return Result.success(userPage);
    }

    @GetMapping("/{id}")
    public Result<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user == null) {
            return Result.error("用户不存在");
        }
        return Result.success(user);
    }

    @PostMapping
    public Result<User> createUser(@Validated @RequestBody UserDTO userDTO) {
        return userService.createUser(userDTO);
    }

    @PutMapping("/{id}")
    public Result<User> updateUser(@PathVariable Long id, @Validated @RequestBody UserDTO userDTO) {
        return userService.updateUser(id, userDTO);
    }

    @DeleteMapping("/{id}")
    public Result<String> deleteUser(@PathVariable Long id) {
        return userService.deleteUser(id);
    }

    @PutMapping("/{id}/status")
    public Result<String> toggleUserStatus(@PathVariable Long id) {
        return userService.toggleUserStatus(id);
    }
}