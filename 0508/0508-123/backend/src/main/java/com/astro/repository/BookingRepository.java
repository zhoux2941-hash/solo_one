package com.astro.repository;

import com.astro.entity.Booking;
import com.astro.entity.Telescope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByTelescopeOrderByStartTimeAsc(Telescope telescope);

    @Query("SELECT b FROM Booking b WHERE b.telescope.id = :telescopeId " +
           "AND b.startTime >= :startTime AND b.endTime <= :endTime " +
           "AND b.status IN ('CONFIRMED', 'IN_PROGRESS', 'PENDING')")
    List<Booking> findOverlappingBookings(
            @Param("telescopeId") Long telescopeId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    List<Booking> findByUserIdOrderByStartTimeDesc(String userId);

    @Query("SELECT b FROM Booking b WHERE b.endTime <= :now AND b.status = 'IN_PROGRESS'")
    List<Booking> findCompletedBookings(@Param("now") LocalDateTime now);

    @Query("SELECT b FROM Booking b WHERE b.telescope.id = :telescopeId " +
           "AND b.startTime >= :startOfDay AND b.startTime < :endOfDay " +
           "AND b.status IN ('CONFIRMED', 'IN_PROGRESS', 'PENDING')")
    List<Booking> findByTelescopeAndDate(
            @Param("telescopeId") Long telescopeId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

    @Query("SELECT b FROM Booking b WHERE b.telescope.id = :telescopeId " +
           "AND b.startTime >= :startTime AND b.startTime < :endTime " +
           "AND b.status IN ('CONFIRMED', 'IN_PROGRESS', 'PENDING')")
    List<Booking> findByTelescopeAndTimeRange(
            @Param("telescopeId") Long telescopeId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}
