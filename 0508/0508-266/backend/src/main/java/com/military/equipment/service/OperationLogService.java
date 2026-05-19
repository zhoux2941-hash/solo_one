package com.military.equipment.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.military.equipment.common.PageQuery;
import com.military.equipment.entity.OperationLog;
import com.military.equipment.mapper.OperationLogMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service
public class OperationLogService {

    @Resource
    private OperationLogMapper operationLogMapper;

    public Page<OperationLog> list(String module, String type, Integer status, PageQuery pageQuery) {
        QueryWrapper<OperationLog> wrapper = new QueryWrapper<>();
        if (module != null) {
            wrapper.like("operation_module", module);
        }
        if (type != null) {
            wrapper.eq("operation_type", type);
        }
        if (status != null) {
            wrapper.eq("operation_status", status);
        }
        wrapper.orderByDesc("created_time");

        Page<OperationLog> page = new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize());
        return operationLogMapper.selectPage(page, wrapper);
    }

    public List<OperationLog> export(String module, String type, Integer status) {
        QueryWrapper<OperationLog> wrapper = new QueryWrapper<>();
        if (module != null) {
            wrapper.like("operation_module", module);
        }
        if (type != null) {
            wrapper.eq("operation_type", type);
        }
        if (status != null) {
            wrapper.eq("operation_status", status);
        }
        wrapper.orderByDesc("created_time");
        return operationLogMapper.selectList(wrapper);
    }
}
