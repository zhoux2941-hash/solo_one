package com.petboarding.repository;

import com.petboarding.entity.BookingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingLogRepository extends JpaRepository<BookingLog, Long> {
    List<BookingLog> findByBookingId(Long bookingId);
    
    @Query("SELECT bl FROM BookingLog bl WHERE bl.action = 'REJECT' AND bl.startDate BETWEEN :startDate AND :endDate")
    List<BookingLog> findRejectedLogsInDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
