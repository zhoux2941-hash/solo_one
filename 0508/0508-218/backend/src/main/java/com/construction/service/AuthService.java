package com.construction.service;

import com.construction.common.Result;
import com.construction.entity.User;
import com.construction.repository.UserRepository;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    @Resource
    private UserRepository userRepository;

    public Result<Map<String, Object>> login(String username, String password, HttpSession session) {
        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            return Result.error("用户名不存在");
        }

        if (!user.getPassword().equals(password)) {
            return Result.error("密码错误");
        }

        if (user.getStatus() != 1) {
            return Result.error("用户已被禁用");
        }

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("realName", user.getRealName());
        userInfo.put("phone", user.getPhone());
        userInfo.put("email", user.getEmail());
        userInfo.put("role", user.getRole());

        session.setAttribute("currentUser", userInfo);

        return Result.success("登录成功", userInfo);
    }

    public Result<Void> logout(HttpSession session) {
        session.removeAttribute("currentUser");
        session.invalidate();
        return Result.success();
    }
}
