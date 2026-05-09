package com.lab.reagent.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lab.reagent.entity.User;
import com.lab.reagent.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;

    public User login(String username, String password) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", username).eq("password", password);
        return userMapper.selectOne(wrapper);
    }

    public User getById(Long id) {
        return userMapper.selectById(id);
    }

    public List<User> getAllTeachers() {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("role", "teacher");
        return userMapper.selectList(wrapper);
    }

    public List<User> getAllUsers() {
        return userMapper.selectList(null);
    }
}
