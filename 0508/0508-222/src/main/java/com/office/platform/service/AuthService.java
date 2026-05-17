package com.office.platform.service;

import com.office.platform.common.LoginUser;
import com.office.platform.common.Result;
import com.office.platform.dto.LoginDTO;
import com.office.platform.entity.User;
import com.office.platform.repository.UserRepository;
import com.office.platform.util.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpSession;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public Result<LoginUser> login(LoginDTO loginDTO, HttpSession session) {
        User user = userRepository.findByUsername(loginDTO.getUsername());

        if (user == null) {
            return Result.error("用户名不存在");
        }

        if (!user.getEnabled()) {
            return Result.error("用户已被禁用");
        }

        if (!PasswordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            return Result.error("密码错误");
        }

        LoginUser loginUser = new LoginUser();
        loginUser.setId(user.getId());
        loginUser.setUsername(user.getUsername());
        loginUser.setRealName(user.getRealName());
        loginUser.setRole(user.getRole());
        if (user.getDepartment() != null) {
            loginUser.setDepartmentId(user.getDepartment().getId());
            loginUser.setDepartmentName(user.getDepartment().getName());
        }

        LoginUser.setToSession(session, loginUser);

        return Result.success("登录成功", loginUser);
    }

    public Result<String> logout(HttpSession session) {
        LoginUser.removeFromSession(session);
        return Result.success("退出成功");
    }

    public Result<LoginUser> getCurrentUser(HttpSession session) {
        LoginUser loginUser = LoginUser.getFromSession(session);
        if (loginUser == null) {
            return Result.error(401, "未登录");
        }
        return Result.success(loginUser);
    }
}