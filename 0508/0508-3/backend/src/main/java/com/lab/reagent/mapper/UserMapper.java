package com.lab.reagent.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lab.reagent.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
