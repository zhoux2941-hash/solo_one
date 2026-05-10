package com.dubbing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dubbing.entity.Message;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MessageMapper extends BaseMapper<Message> {
}
