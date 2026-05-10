package com.driving.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.driving.entity.Booking;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface BookingMapper extends BaseMapper<Booking> {

    @Select("SELECT COUNT(*) FROM booking WHERE student_id = #{studentId} " +
            "AND booking_date = #{date} AND status IN (1, 2) AND deleted = 0")
    Integer countStudentDailyBookings(@Param("studentId") Long studentId, @Param("date") LocalDate date);

    @Select("SELECT b.*, u.name as student_name, c.car_model, cu.name as coach_name, " +
            "cg.status as carpool_status, cg.member_count as carpool_member_count " +
            "FROM booking b " +
            "JOIN user u ON b.student_id = u.id " +
            "JOIN coach c ON b.coach_id = c.id " +
            "JOIN user cu ON c.user_id = cu.id " +
            "LEFT JOIN carpool_group cg ON b.carpool_group_id = cg.id " +
            "WHERE b.student_id = #{studentId} AND b.deleted = 0 " +
            "ORDER BY b.booking_date DESC, b.start_hour DESC")
    List<Map<String, Object>> selectStudentBookings(@Param("studentId") Long studentId);

    @Select("SELECT b.*, u.name as student_name, u.phone as student_phone, " +
            "cg.status as carpool_status, cg.member_count as carpool_member_count " +
            "FROM booking b " +
            "JOIN user u ON b.student_id = u.id " +
            "LEFT JOIN carpool_group cg ON b.carpool_group_id = cg.id " +
            "WHERE b.coach_id = #{coachId} AND b.deleted = 0 " +
            "ORDER BY b.booking_date DESC, b.start_hour DESC")
    List<Map<String, Object>> selectCoachBookings(@Param("coachId") Long coachId);

    @Select("SELECT b.*, r.id as rating_id " +
            "FROM booking b LEFT JOIN rating r ON b.id = r.booking_id " +
            "WHERE b.id = #{bookingId} AND b.deleted = 0")
    Map<String, Object> selectBookingWithRating(@Param("bookingId") Long bookingId);
}