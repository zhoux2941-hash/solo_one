package com.charging.repository;

import com.charging.entity.Reservation;
import com.charging.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserId(Long userId);
    List<Reservation> findByPileId(Long pileId);
    List<Reservation> findByStatus(ReservationStatus status);
    List<Reservation> findByExpiredAtBeforeAndStatus(LocalDateTime time, ReservationStatus status);
    
    @Query("SELECT r FROM Reservation r WHERE r.status = :status AND r.endTime < :time")
    List<Reservation> findByStatusAndEndTimeBefore(@Param("status") ReservationStatus status, @Param("time") LocalDateTime time);

    @Query("SELECT r FROM Reservation r WHERE r.pileId = :pileId AND r.status IN :statuses AND r.startTime < :endTime AND r.endTime > :startTime")
    List<Reservation> findOverlappingReservations(
            @Param("pileId") Long pileId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") List<ReservationStatus> statuses);

    @Query("SELECT r FROM Reservation r WHERE r.pileId = :pileId AND r.status = :status AND r.startTime >= :start AND r.startTime < :end")
    List<Reservation> findByPileIdAndStatusAndTimeRange(
            @Param("pileId") Long pileId,
            @Param("status") ReservationStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
    
    @Query("SELECT r FROM Reservation r WHERE r.status IN :statuses AND r.startTime >= :start AND r.startTime < :end")
    List<Reservation> findByStatusesAndTimeRange(
            @Param("statuses") List<ReservationStatus> statuses,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
    
    @Query("SELECT r FROM Reservation r WHERE r.pileId = :pileId AND r.status IN :statuses")
    List<Reservation> findByPileIdAndStatuses(
            @Param("pileId") Long pileId,
            @Param("statuses") List<ReservationStatus> statuses);
    
    @Query("SELECT r FROM Reservation r WHERE r.status IN :statuses")
    List<Reservation> findByStatuses(
            @Param("statuses") List<ReservationStatus> statuses);
}
