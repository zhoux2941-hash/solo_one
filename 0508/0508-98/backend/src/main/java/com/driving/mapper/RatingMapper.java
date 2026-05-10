package com.driving.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.driving.entity.Rating;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface RatingMapper extends BaseMapper<Rating> {

    @Select("SELECT r.*, u.name as student_name, b.booking_date, b.start_hour " +
            "FROM rating r " +
            "JOIN user u ON r.student_id = u.id " +
            "JOIN booking b ON r.booking_id = b.id " +
            "WHERE r.coach_id = #{coachId} AND r.deleted = 0 " +
            "ORDER BY r.create_time DESC")
    List<Map<String, Object>> selectCoachRatings(@Param("coachId") Long coachId);
}