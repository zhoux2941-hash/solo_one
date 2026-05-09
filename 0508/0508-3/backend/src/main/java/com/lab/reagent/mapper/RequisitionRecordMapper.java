package com.lab.reagent.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lab.reagent.entity.RequisitionRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RequisitionRecordMapper extends BaseMapper<RequisitionRecord> {
    @Select("<script>" +
            "SELECT rr.*, u.name as user_name, u.department, rg.name as reagent_name, o.name as operator_name " +
            "FROM requisition_record rr " +
            "LEFT JOIN user u ON rr.user_id = u.id " +
            "LEFT JOIN user o ON rr.operator_id = o.id " +
            "LEFT JOIN reagent rg ON rr.reagent_id = rg.id " +
            "<where>" +
            "<if test='category != null and category != \"\"'> rg.category = #{category} </if>" +
            "<if test='startDate != null and startDate != \"\"'> AND date(rr.operation_time) &gt;= #{startDate} </if>" +
            "<if test='endDate != null and endDate != \"\"'> AND date(rr.operation_time) &lt;= #{endDate} </if>" +
            "<if test='userId != null'> AND rr.user_id = #{userId} </if>" +
            "</where>" +
            "ORDER BY rr.id DESC" +
            "</script>")
    List<RequisitionRecord> searchRecords(@Param("category") String category,
                                          @Param("startDate") String startDate,
                                          @Param("endDate") String endDate,
                                          @Param("userId") Long userId);

    @Select("SELECT rr.reagent_id as reagentId, rg.name as reagentName, rg.category, rg.specification, rg.unit, " +
            "SUM(rr.quantity) as totalQuantity, COUNT(*) as approvalCount " +
            "FROM requisition_record rr " +
            "LEFT JOIN reagent rg ON rr.reagent_id = rg.id " +
            "WHERE rr.operation_type = 'approved' " +
            "AND strftime('%Y-%m', rr.operation_time) = #{yearMonth} " +
            "GROUP BY rr.reagent_id, rg.name, rg.category, rg.specification, rg.unit " +
            "ORDER BY totalQuantity DESC")
    List<com.lab.reagent.dto.MonthlyStatsDTO> getMonthlyStats(@Param("yearMonth") String yearMonth);
}
