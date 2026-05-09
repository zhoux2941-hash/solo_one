package com.gym.repository;

import com.gym.entity.Booking;
import com.gym.entity.Booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    Optional<Booking> findByUserIdAndCourseId(Long userId, Long courseId);
    
    List<Booking> findByCourseId(Long courseId);
    
    List<Booking> findByUserId(Long userId);
    
    long countByCourseIdAndStatus(Long courseId, BookingStatus status);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.courseId = :courseId")
    long countBookingsByCourseId(@Param("courseId") Long courseId);
    
    @Query("SELECT b FROM Booking b WHERE b.status = 'BOOKED' " +
           "AND EXISTS (SELECT c FROM Course c WHERE c.courseId = b.courseId " +
           "AND c.endTime < :currentTime)")
    List<Booking> findExpiredBookings(@Param("currentTime") LocalDateTime currentTime);
    
    @Query("SELECT c.coachId, c.coachName, COUNT(b), " +
           "SUM(CASE WHEN b.status = 'CHECKED_IN' THEN 1 ELSE 0 END) " +
           "FROM Booking b JOIN Course c ON b.courseId = c.courseId " +
           "WHERE c.startTime BETWEEN :start AND :end " +
           "GROUP BY c.coachId, c.coachName")
    List<Object[]> getCoachCheckinStats(@Param("start") LocalDateTime start, 
                                         @Param("end") LocalDateTime end);
    
    @Query("SELECT c.name, COUNT(b), " +
           "SUM(CASE WHEN b.status = 'NO_SHOW' THEN 1 ELSE 0 END) " +
           "FROM Booking b JOIN Course c ON b.courseId = c.courseId " +
           "GROUP BY c.courseId, c.name " +
           "ORDER BY SUM(CASE WHEN b.status = 'NO_SHOW' THEN 1 ELSE 0 END) DESC")
    List<Object[]> getTopNoShowCourses();
    
    @Query("SELECT DISTINCT b.userId FROM Booking b")
    List<Long> getAllUserIds();
    
    @Query("SELECT b.userId, c.name, COUNT(b), " +
           "SUM(CASE WHEN b.status = 'CHECKED_IN' THEN 1 ELSE 0 END) " +
           "FROM Booking b JOIN Course c ON b.courseId = c.courseId " +
           "WHERE b.userId = :userId " +
           "GROUP BY b.userId, c.name")
    List<Object[]> getUserCoursePreferences(@Param("userId") Long userId);
    
    @Query("SELECT b.userId, c.coachId, c.coachName, COUNT(b), " +
           "SUM(CASE WHEN b.status = 'CHECKED_IN' THEN 1 ELSE 0 END) " +
           "FROM Booking b JOIN Course c ON b.courseId = c.courseId " +
           "WHERE b.userId = :userId " +
           "GROUP BY b.userId, c.coachId, c.coachName")
    List<Object[]> getUserCoachPreferences(@Param("userId") Long userId);
    
    @Query("SELECT b.userId, c.courseId, c.name, c.coachId, c.coachName, " +
           "c.startTime, c.endTime, c.capacity, c.description, " +
           "COUNT(b) as bookingCount, " +
           "SUM(CASE WHEN b.status = 'CHECKED_IN' THEN 1 ELSE 0 END) as checkinCount " +
           "FROM Booking b JOIN Course c ON b.courseId = c.courseId " +
           "WHERE b.userId = :userId AND b.status IN ('BOOKED', 'CHECKED_IN') " +
           "GROUP BY b.userId, c.courseId, c.name, c.coachId, c.coachName, " +
           "c.startTime, c.endTime, c.capacity, c.description " +
           "ORDER BY checkinCount DESC")
    List<Object[]> getUserBookedCourses(@Param("userId") Long userId);
}
