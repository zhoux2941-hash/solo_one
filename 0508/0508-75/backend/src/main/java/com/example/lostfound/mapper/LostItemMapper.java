package com.example.lostfound.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.lostfound.entity.LostItem;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface LostItemMapper extends BaseMapper<LostItem> {
}
