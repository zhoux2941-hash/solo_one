package com.dubbing.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dubbing.entity.Transaction;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TransactionMapper extends BaseMapper<Transaction> {
}
