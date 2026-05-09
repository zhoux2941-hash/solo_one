package com.lab.reagent.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lab.reagent.entity.Reagent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ReagentMapper extends BaseMapper<Reagent> {
    @Update("UPDATE reagent SET quantity = quantity - #{quantity}, update_time = datetime('now','localtime') WHERE id = #{id} AND quantity >= #{quantity}")
    int decreaseQuantity(Long id, Integer quantity);

    @Update("UPDATE reagent SET quantity = quantity + #{quantity}, update_time = datetime('now','localtime') WHERE id = #{id}")
    int increaseQuantity(Long id, Integer quantity);
}
