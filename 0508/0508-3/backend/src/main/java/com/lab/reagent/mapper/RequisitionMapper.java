package com.lab.reagent.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lab.reagent.entity.Requisition;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RequisitionMapper extends BaseMapper<Requisition> {
    @Select("SELECT r.*, u.name as user_name, u.department, u2.name as approver_name, rg.name as reagent_name " +
            "FROM requisition r " +
            "LEFT JOIN user u ON r.user_id = u.id " +
            "LEFT JOIN user u2 ON r.approver_id = u2.id " +
            "LEFT JOIN reagent rg ON r.reagent_id = rg.id " +
            "ORDER BY r.create_time DESC")
    List<Requisition> selectAllWithDetails();
}
