package com.dubbing.controller;

import com.dubbing.common.Result;
import com.dubbing.dto.LoginDTO;
import com.dubbing.dto.RegisterDTO;
import com.dubbing.service.UserService;
import com.dubbing.vo.UserVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public Result<UserVO> register(@Validated @RequestBody RegisterDTO dto) {
        UserVO userVO = userService.register(dto);
        return Result.success("注册成功", userVO);
    }

    @PostMapping("/login")
    public Result<UserVO> login(@Validated @RequestBody LoginDTO dto) {
        UserVO userVO = userService.login(dto);
        return Result.success("登录成功", userVO);
    }

    @GetMapping("/info")
    public Result<UserVO> getCurrentUserInfo() {
        UserVO userVO = userService.getCurrentUserInfo();
        return Result.success(userVO);
    }
}
