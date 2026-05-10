package com.example.trashbin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.trashbin.entity.Product;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProductMapper extends BaseMapper<Product> {
}
