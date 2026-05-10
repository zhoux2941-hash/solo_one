package com.dorm.bill.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dorm.bill.config.JwtUtil;
import com.dorm.bill.dto.LoginRequest;
import com.dorm.bill.dto.RegisterRequest;
import com.dorm.bill.entity.Dormitory;
import com.dorm.bill.entity.User;
import com.dorm.bill.mapper.DormitoryMapper;
import com.dorm.bill.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private DormitoryMapper dormitoryMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        User existUser = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername())
        );
        if (existUser != null) {
            throw new RuntimeException("用户名已存在");
        }

        Dormitory dormitory = dormitoryMapper.selectOne(
                new LambdaQueryWrapper<Dormitory>().eq(Dormitory::getDormNumber, request.getDormNumber())
        );
        if (dormitory == null) {
            dormitory = new Dormitory();
            dormitory.setDormNumber(request.getDormNumber());
            dormitoryMapper.insert(dormitory);
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(DigestUtils.md5DigestAsHex(request.getPassword().getBytes(StandardCharsets.UTF_8)));
        user.setNickname(request.getNickname());
        user.setDormId(dormitory.getId());
        userMapper.insert(user);

        Map<String, Object> result = new HashMap<>();
        result.put("token", jwtUtil.generateToken(user.getId()));
        result.put("user", buildUserInfo(user, dormitory));
        return result;
    }

    public Map<String, Object> login(LoginRequest request) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername())
        );
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        String inputPassword = DigestUtils.md5DigestAsHex(request.getPassword().getBytes(StandardCharsets.UTF_8));
        if (!inputPassword.equals(user.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        Dormitory dormitory = dormitoryMapper.selectById(user.getDormId());

        Map<String, Object> result = new HashMap<>();
        result.put("token", jwtUtil.generateToken(user.getId()));
        result.put("user", buildUserInfo(user, dormitory));
        return result;
    }

    public Map<String, Object> getCurrentUserInfo(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        Dormitory dormitory = dormitoryMapper.selectById(user.getDormId());
        return buildUserInfo(user, dormitory);
    }

    private Map<String, Object> buildUserInfo(User user, Dormitory dormitory) {
        Map<String, Object> info = new HashMap<>();
        info.put("id", user.getId());
        info.put("username", user.getUsername());
        info.put("nickname", user.getNickname());
        info.put("dormId", user.getDormId());
        info.put("dormNumber", dormitory != null ? dormitory.getDormNumber() : null);
        return info;
    }
}
