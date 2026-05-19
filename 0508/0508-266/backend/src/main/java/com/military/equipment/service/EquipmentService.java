package com.military.equipment.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.military.equipment.annotation.OperateLog;
import com.military.equipment.common.PageQuery;
import com.military.equipment.entity.Equipment;
import com.military.equipment.exception.BusinessException;
import com.military.equipment.mapper.EquipmentMapper;
import com.military.equipment.util.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.util.List;

@Service
public class EquipmentService {

    @Resource
    private EquipmentMapper equipmentMapper;

    public Page<Equipment> list(String keyword, Integer status, Integer secretLevel, PageQuery pageQuery) {
        QueryWrapper<Equipment> wrapper = new QueryWrapper<>();
        if (keyword != null) {
            wrapper.and(w -> w.like("equipment_name", keyword)
                    .or().like("rfid_code", keyword)
                    .or().like("equipment_model", keyword));
        }
        if (status != null) {
            wrapper.eq("equipment_status", status);
        }
        if (secretLevel != null) {
            wrapper.eq("secret_level", secretLevel);
        }

        String roleCode = UserContext.getRoleCode();
        if ("OPERATOR".equals(roleCode)) {
            wrapper.eq("equipment_status", 1);
        }

        wrapper.orderByDesc("created_time");

        Page<Equipment> page = new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize());
        return equipmentMapper.selectPage(page, wrapper);
    }

    public Equipment getById(Long id) {
        return equipmentMapper.selectById(id);
    }

    @OperateLog(module = "装备管理", type = "新增", desc = "新增装备")
    @Transactional(rollbackFor = Exception.class)
    public void add(Equipment equipment) {
        Equipment exist = equipmentMapper.selectOne(
                new QueryWrapper<Equipment>()
                        .eq("rfid_code", equipment.getRfidCode())
                        .eq("deleted", 0)
        );
        if (exist != null) {
            throw new BusinessException("RFID编号已存在");
        }
        equipment.setEquipmentStatus(1);
        equipmentMapper.insert(equipment);
    }

    @OperateLog(module = "装备管理", type = "修改", desc = "修改装备")
    @Transactional(rollbackFor = Exception.class)
    public void update(Equipment equipment) {
        Equipment exist = equipmentMapper.selectOne(
                new QueryWrapper<Equipment>()
                        .eq("rfid_code", equipment.getRfidCode())
                        .eq("deleted", 0)
                        .ne("id", equipment.getId())
        );
        if (exist != null) {
            throw new BusinessException("RFID编号已存在");
        }
        equipmentMapper.updateById(equipment);
    }

    @OperateLog(module = "装备管理", type = "删除", desc = "删除装备")
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        equipmentMapper.deleteById(id);
    }

    public List<Equipment> export(String keyword, Integer status, Integer secretLevel) {
        QueryWrapper<Equipment> wrapper = new QueryWrapper<>();
        if (keyword != null) {
            wrapper.and(w -> w.like("equipment_name", keyword)
                    .or().like("rfid_code", keyword));
        }
        if (status != null) {
            wrapper.eq("equipment_status", status);
        }
        if (secretLevel != null) {
            wrapper.eq("secret_level", secretLevel);
        }
        return equipmentMapper.selectList(wrapper);
    }
}
