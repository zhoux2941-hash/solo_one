package com.driving.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.driving.entity.Coach;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface CoachMapper extends BaseMapper<Coach> {

    @Select("SELECT c.id, c.user_id, c.car_model, c.avg_rating, c.rating_count, c.accept_carpool, u.name " +
            "FROM coach c JOIN user u ON c.user_id = u.id " +
            "WHERE c.deleted = 0 AND u.deleted = 0 AND u.role = 'COACH'")
    List<Map<String, Object>> selectCoachList();

    @Select("SELECT c.id, c.user_id, c.car_model, c.avg_rating, c.rating_count, c.accept_carpool, u.name " +
            "FROM coach c JOIN user u ON c.user_id = u.id " +
            "WHERE c.id = #{coachId} AND c.deleted = 0")
    Map<String, Object> selectCoachWithName(@Param("coachId") Long coachId);
}