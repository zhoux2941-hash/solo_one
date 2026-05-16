package com.health.repository;

import com.health.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.reservationDate = :date AND r.status = 'CONFIRMED'")
    long countByDate(@Param("date") LocalDate date);

    List<Reservation> findByPhoneOrderByCreatedAtDesc(String phone);

    List<Reservation> findByReservationDateOrderByCreatedAtDesc(LocalDate date);

    List<Reservation> findByStatusOrderByCreatedAtDesc(String status);
}
