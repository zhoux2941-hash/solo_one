package com.example.lostfound.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.lostfound.entity.FoundItem;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface FoundItemMapper extends BaseMapper<FoundItem> {
}
