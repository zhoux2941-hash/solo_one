package com.company.seatbooking.repository;

import com.company.seatbooking.entity.Booking;
import com.company.seatbooking.entity.Booking.BookingStatus;
import com.company.seatbooking.entity.Booking.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByDateAndStatus(LocalDate date, BookingStatus status);
    
    List<Booking> findBySeat_SeatIdAndDateAndStatus(Long seatId, LocalDate date, BookingStatus status);
    
    List<Booking> findByUserIdAndDateAndStatus(Long userId, LocalDate date, BookingStatus status);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.seat.area = :area " +
           "AND b.date = :date AND b.status = :status")
    Long countByAreaAndDateAndStatus(@Param("area") String area, 
                                      @Param("date") LocalDate date, 
                                      @Param("status") BookingStatus status);
    
    @Query("SELECT b.seat.seatId, COUNT(b) as count FROM Booking b " +
           "WHERE b.status = :status " +
           "GROUP BY b.seat.seatId " +
           "ORDER BY count DESC")
    List<Object[]> findTopSeatsByBookingCount(@Param("status") BookingStatus status);
    
    @Query("SELECT b.seat.area, b.date, b.timeSlot, COUNT(b) FROM Booking b " +
           "WHERE b.status = :status AND b.date >= :startDate AND b.date <= :endDate " +
           "GROUP BY b.seat.area, b.date, b.timeSlot")
    List<Object[]> findBookingStatistics(@Param("status") BookingStatus status,
                                          @Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate);
    
    @Query("SELECT b.timeSlot, b.date, COUNT(b) FROM Booking b " +
           "WHERE b.status = :status AND b.date >= :startDate AND b.date <= :endDate " +
           "GROUP BY b.timeSlot, b.date")
    List<Object[]> findTimeSlotStatistics(@Param("status") BookingStatus status,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);
    
    @Query("SELECT b FROM Booking b WHERE b.seat.seatId = :seatId " +
           "AND b.date = :date AND b.status = :status " +
           "AND (b.timeSlot = :timeSlot OR b.timeSlot = 'FULL_DAY' OR :timeSlot = 'FULL_DAY')")
    List<Booking> findConflictingBookings(@Param("seatId") Long seatId,
                                           @Param("date") LocalDate date,
                                           @Param("timeSlot") TimeSlot timeSlot,
                                           @Param("status") BookingStatus status);
    
    @Query("SELECT b FROM Booking b WHERE b.userId = :userId AND b.status = 'CONFIRMED' " +
           "ORDER BY b.date ASC")
    List<Booking> findConfirmedBookingsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT b FROM Booking b WHERE b.date = :date " +
           "AND b.status = 'CONFIRMED' " +
           "AND b.checkInTime IS NULL")
    List<Booking> findTodayUncheckedInBookings(@Param("date") LocalDate date);
    
    @Query("SELECT b FROM Booking b WHERE b.userId = :userId " +
           "AND b.date = :date " +
           "AND (b.status = 'CONFIRMED' OR b.status = 'CHECKED_IN')")
    List<Booking> findUserActiveBookings(@Param("userId") Long userId,
                                          @Param("date") LocalDate date);
}
