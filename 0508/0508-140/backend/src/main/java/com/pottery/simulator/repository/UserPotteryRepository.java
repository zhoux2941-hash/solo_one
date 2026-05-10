package com.pottery.simulator.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pottery.simulator.entity.UserPottery;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserPotteryRepository extends BaseMapper<UserPottery> {

}
