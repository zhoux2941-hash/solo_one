package com.volunteer.service;

import com.volunteer.entity.Attendance;
import java.util.List;

public interface AttendanceService {
    Attendance checkIn(Long userId, Long activityId);
    Attendance checkOut(Long userId, Long activityId);
    Attendance forceCheckOut(Long attendanceId, Long adminId, Integer customMinutes);
    List<Attendance> findByUserId(Long userId);
    List<Attendance> findByStatus(String status);
    List<Attendance> findPending();
    List<Attendance> findUncheckedOut();
    Attendance approve(Long attendanceId, Long adminId);
    Attendance reject(Long attendanceId, Long adminId);
    Integer getTotalApprovedMinutes(Long userId);
    List<Object[]> getRanking();
}
