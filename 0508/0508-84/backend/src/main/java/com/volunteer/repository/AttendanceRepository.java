package com.volunteer.repository;

import com.volunteer.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByUserIdAndActivityIdAndCheckOutTimeIsNull(Long userId, Long activityId);
    List<Attendance> findByUserIdOrderByCreateTimeDesc(Long userId);
    List<Attendance> findByStatusOrderByCreateTimeDesc(String status);
    List<Attendance> findByUserIdAndStatusOrderByCreateTimeDesc(Long userId, String status);
    
    List<Attendance> findByCheckOutTimeIsNull();
    List<Attendance> findByCheckOutTimeIsNullAndCheckInTimeBefore(LocalDateTime time);
    
    @Query("SELECT a FROM Attendance a WHERE a.checkOutTime IS NULL " +
           "AND a.activityId IN (SELECT act.id FROM Activity act WHERE act.endTime < :now)")
    List<Attendance> findUncheckedOutByActivityEnded(@Param("now") LocalDateTime now);
    
    @Query("SELECT COALESCE(SUM(a.durationMinutes), 0) FROM Attendance a WHERE a.userId = :userId AND a.status = 'APPROVED'")
    Integer sumApprovedDurationByUserId(@Param("userId") Long userId);
    
    @Query("SELECT a.userId, COALESCE(SUM(a.durationMinutes), 0) as totalMinutes " +
           "FROM Attendance a WHERE a.status = 'APPROVED' " +
           "GROUP BY a.userId ORDER BY totalMinutes DESC")
    List<Object[]> findTotalMinutesRanking();
}
