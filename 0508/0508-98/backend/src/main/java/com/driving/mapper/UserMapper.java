package com.driving.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.driving.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}