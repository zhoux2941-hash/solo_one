package com.logistics.park.controller;

import com.logistics.park.dto.LoginRequest;
import com.logistics.park.dto.Result;
import com.logistics.park.entity.Role;
import com.logistics.park.entity.User;
import com.logistics.park.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import javax.validation.Valid;

@RestController
@RequestMapping("/api/user")
@Validated
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public Result<User> login(@Valid @RequestBody LoginRequest request, HttpSession session) {
        User user = userService.login(request);
        if (user != null) {
            session.setAttribute("currentUser", user);
            return Result.success("登录成功", user);
        }
        return Result.error("登录失败，手机号或密码错误，或账号已禁用");
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpSession session) {
        session.invalidate();
        return Result.success();
    }

    @GetMapping("/current")
    public Result<User> getCurrentUser(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user != null) {
            return Result.success(user);
        }
        return Result.error(401, "未登录");
    }

    @PostMapping
    public Result<User> createUser(@Valid @RequestBody User user, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null || !Role.ADMIN.equals(currentUser.getRole())) {
            return Result.error(403, "无权限操作");
        }
        try {
            User created = userService.createUser(user);
            return Result.success("创建成功", created);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Result<User> updateUser(@PathVariable Long id, @Valid @RequestBody User user, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null || !Role.ADMIN.equals(currentUser.getRole())) {
            return Result.error(403, "无权限操作");
        }
        try {
            User updated = userService.updateUser(id, user);
            return Result.success("更新成功", updated);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/{id}/toggle-status")
    public Result<Void> toggleUserStatus(@PathVariable Long id, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null || !Role.ADMIN.equals(currentUser.getRole())) {
            return Result.error(403, "无权限操作");
        }
        try {
            userService.toggleUserStatus(id);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable Long id, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null || !Role.ADMIN.equals(currentUser.getRole())) {
            return Result.error(403, "无权限操作");
        }
        userService.deleteUser(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user != null) {
            return Result.success(user);
        }
        return Result.error("用户不存在");
    }

    @GetMapping("/page")
    public Result<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String name,
            HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        Page<User> users = userService.getUsers(page, size, role, name);
        return Result.success(users);
    }

    @GetMapping("/check-phone")
    public Result<Boolean> checkPhone(@RequestParam String phone) {
        return Result.success(userService.existsByPhone(phone));
    }
}
