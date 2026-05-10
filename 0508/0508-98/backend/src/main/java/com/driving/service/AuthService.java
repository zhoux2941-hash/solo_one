package com.driving.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.driving.common.BusinessException;
import com.driving.dto.LoginDTO;
import com.driving.entity.Coach;
import com.driving.entity.User;
import com.driving.mapper.CoachMapper;
import com.driving.mapper.UserMapper;
import com.driving.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private CoachMapper coachMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public Map<String, Object> login(LoginDTO loginDTO) {
        User user = userMapper.selectOne(
                new QueryWrapper<User>()
                        .eq("username", loginDTO.getUsername())
                        .eq("deleted", 0)
        );

        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            throw new BusinessException("密码错误");
        }

        if (user.getStatus() == null || user.getStatus() == 0) {
            throw new BusinessException("账号已禁用");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("name", user.getName());
        result.put("role", user.getRole());

        if ("COACH".equals(user.getRole())) {
            Coach coach = coachMapper.selectOne(
                    new QueryWrapper<Coach>().eq("user_id", user.getId())
            );
            if (coach != null) {
                result.put("coachId", coach.getId());
            }
        }

        return result;
    }
}