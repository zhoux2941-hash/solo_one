package com.example.trashbin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.trashbin.entity.Resident;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ResidentMapper extends BaseMapper<Resident> {
}
