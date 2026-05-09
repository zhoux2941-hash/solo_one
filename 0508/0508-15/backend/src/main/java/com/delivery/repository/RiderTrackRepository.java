package com.delivery.repository;

import com.delivery.entity.RiderTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RiderTrackRepository extends JpaRepository<RiderTrack, Long> {

    List<RiderTrack> findByRiderIdOrderByReportedAtDesc(String riderId);

    List<RiderTrack> findByOrderIdOrderByReportedAtAsc(String orderId);

    @Query("SELECT rt FROM RiderTrack rt WHERE rt.riderId = :riderId AND rt.reportedAt BETWEEN :start AND :end ORDER BY rt.reportedAt ASC")
    List<RiderTrack> findTracksByRiderBetweenDates(String riderId, LocalDateTime start, LocalDateTime end);
}
