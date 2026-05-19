package com.military.equipment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.military.equipment.entity.SysMenu;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SysMenuMapper extends BaseMapper<SysMenu> {
    List<SysMenu> selectMenusByRoleIds(@Param("roleIds") List<Long> roleIds);
}
