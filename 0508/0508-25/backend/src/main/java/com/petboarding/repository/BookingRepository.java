package com.petboarding.repository;

import com.petboarding.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByPetId(Long petId);
    
    List<Booking> findByRoomId(Long roomId);
    
    List<Booking> findByOwnerId(Long ownerId);
    
    List<Booking> findByStatus(Booking.BookingStatus status);
    
    @Query("SELECT b FROM Booking b WHERE b.roomId = :roomId AND b.status IN ('PENDING', 'CONFIRMED') AND ((b.startDate <= :endDate) AND (b.endDate >= :startDate))")
    List<Booking> findOverlappingBookings(
            @Param("roomId") Long roomId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
    
    @Query("SELECT b FROM Booking b WHERE b.status IN ('PENDING', 'CONFIRMED') AND b.startDate BETWEEN :startDate AND :endDate")
    List<Booking> findBookingsInDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
    
    @Query("SELECT b FROM Booking b WHERE b.roomId = :roomId AND b.status IN ('CONFIRMED', 'PENDING') AND MONTH(b.startDate) = :month AND YEAR(b.startDate) = :year")
    List<Booking> findBookingsForRoomInMonth(
            @Param("roomId") Long roomId,
            @Param("year") int year,
            @Param("month") int month
    );
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'REJECTED' AND FUNCTION('MONTH', b.startDate) = :month AND FUNCTION('YEAR', b.startDate) = :year")
    Long countRejectedBookingsInMonth(@Param("year") int year, @Param("month") int month);
}
