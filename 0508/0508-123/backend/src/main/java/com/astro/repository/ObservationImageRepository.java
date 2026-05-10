package com.astro.repository;

import com.astro.entity.ObservationImage;
import com.astro.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ObservationImageRepository extends JpaRepository<ObservationImage, Long> {
    Optional<ObservationImage> findByBooking(Booking booking);
    Optional<ObservationImage> findByBookingId(Long bookingId);
}
