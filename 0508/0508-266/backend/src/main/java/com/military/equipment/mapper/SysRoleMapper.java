package com.military.equipment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.military.equipment.entity.SysRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SysRoleMapper extends BaseMapper<SysRole> {
    List<SysRole> selectRolesByUserId(@Param("userId") Long userId);
}
