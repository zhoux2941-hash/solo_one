package com.example.lostfound.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.lostfound.common.Result;
import com.example.lostfound.dto.LoginDTO;
import com.example.lostfound.entity.User;
import com.example.lostfound.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import javax.validation.Valid;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserMapper userMapper;

    @PostMapping("/login")
    public Result<User> login(@RequestBody @Valid LoginDTO loginDTO, HttpSession session) {
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>()
                .eq(User::getUsername, loginDTO.getUsername())
                .eq(User::getPassword, loginDTO.getPassword())
        );
        if (user == null) {
            return Result.error("用户名或密码错误");
        }
        user.setPassword(null);
        session.setAttribute("currentUser", user);
        return Result.success(user);
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody @Valid User user) {
        User exists = userMapper.selectOne(
            new LambdaQueryWrapper<User>()
                .eq(User::getUsername, user.getUsername())
        );
        if (exists != null) {
            return Result.error("用户名已存在");
        }
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        userMapper.insert(user);
        user.setPassword(null);
        return Result.success(user);
    }

    @GetMapping("/current")
    public Result<User> getCurrentUser(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return Result.error(401, "未登录");
        }
        return Result.success(user);
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpSession session) {
        session.invalidate();
        return Result.success();
    }
}
