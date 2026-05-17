package com.scenic.repository;

import com.scenic.entity.VenueBooking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VenueBookingRepository extends JpaRepository<VenueBooking, Long> {

    Optional<VenueBooking> findByBookingCode(String bookingCode);

    @Query("SELECT b FROM VenueBooking b WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR b.bookingCode LIKE %:keyword% OR b.applicantName LIKE %:keyword%) AND " +
           "(:status IS NULL OR :status = '' OR b.status = :status) AND " +
           "(:venueId IS NULL OR b.venue.id = :venueId)")
    Page<VenueBooking> findByConditions(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("venueId") Long venueId,
            Pageable pageable);

    @Query("SELECT b FROM VenueBooking b WHERE b.venue.id = :venueId AND " +
           "b.status IN ('待审核', '已通过') AND " +
           "((b.startTime <= :endTime AND b.endTime >= :startTime))")
    List<VenueBooking> findConflictingBookings(
            @Param("venueId") Long venueId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT b FROM VenueBooking b WHERE b.venue.id = :venueId AND b.id <> :excludeId AND " +
           "b.status IN ('待审核', '已通过') AND " +
           "((b.startTime <= :endTime AND b.endTime >= :startTime))")
    List<VenueBooking> findConflictingBookingsExcludeId(
            @Param("venueId") Long venueId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeId") Long excludeId);

    List<VenueBooking> findByStatus(String status);

    boolean existsByBookingCode(String bookingCode);
}
