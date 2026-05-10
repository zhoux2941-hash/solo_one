package com.driving.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.driving.entity.CarpoolGroup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface CarpoolGroupMapper extends BaseMapper<CarpoolGroup> {

    @Select("SELECT cg.*, u.name as initiator_name, u.phone as initiator_phone " +
            "FROM carpool_group cg JOIN user u ON cg.initiator_id = u.id " +
            "WHERE cg.coach_id = #{coachId} AND cg.slot_date = #{slotDate} " +
            "AND cg.start_hour = #{startHour} AND cg.status = 1 AND cg.deleted = 0")
    Map<String, Object> selectWaitingCarpool(@Param("coachId") Long coachId,
                                              @Param("slotDate") LocalDate slotDate,
                                              @Param("startHour") Integer startHour);

    @Select("SELECT cg.*, u.name as initiator_name, co.car_model, cu.name as coach_name " +
            "FROM carpool_group cg " +
            "JOIN user u ON cg.initiator_id = u.id " +
            "JOIN coach co ON cg.coach_id = co.id " +
            "JOIN user cu ON co.user_id = cu.id " +
            "WHERE cg.initiator_id = #{studentId} OR cg.id IN " +
            "(SELECT b.carpool_group_id FROM booking b WHERE b.student_id = #{studentId} AND b.carpool_group_id IS NOT NULL) " +
            "AND cg.deleted = 0 " +
            "ORDER BY cg.create_time DESC")
    List<Map<String, Object>> selectStudentCarpools(@Param("studentId") Long studentId);
}