package com.carpool.repository;

import com.carpool.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByPublisherIdOrderByCreatedAtDesc(Long publisherId);

    List<Trip> findByStatusOrderByDepartureTimeAsc(String status);

    @Query("SELECT t FROM Trip t WHERE t.destinationCity = :destinationCity " +
           "AND t.departureTime >= :startTime AND t.departureTime <= :endTime " +
           "AND t.status = 'OPEN' " +
           "AND t.availableSeats > 0 " +
           "ORDER BY t.departureTime ASC")
    List<Trip> findMatchingTrips(
            @Param("destinationCity") String destinationCity,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT t FROM Trip t WHERE t.status = 'OPEN' " +
           "AND t.departureTime > :now " +
           "AND t.availableSeats > 0 " +
           "ORDER BY t.createdAt DESC")
    List<Trip> findRecentOpenTrips(@Param("now") LocalDateTime now);

    @Query("SELECT t.destinationCity, COUNT(t) as cnt FROM Trip t " +
           "WHERE t.status = 'OPEN' AND t.departureTime > :now " +
           "GROUP BY t.destinationCity " +
           "ORDER BY cnt DESC")
    List<Object[]> findPopularDestinations(@Param("now") LocalDateTime now);

    @Query("SELECT t FROM Trip t WHERE t.destinationCity = :city " +
           "AND t.status = 'OPEN' " +
           "AND t.departureTime > :now " +
           "ORDER BY t.departureTime ASC")
    List<Trip> findByDestinationCityAndStatusOpen(
            @Param("city") String city,
            @Param("now") LocalDateTime now
    );

    @Query("SELECT t FROM Trip t WHERE t.status = 'OPEN' " +
           "AND t.departureTime >= :startTime AND t.departureTime <= :endTime " +
           "AND t.availableSeats > 0 " +
           "AND t.destinationCity <> :destinationCity " +
           "ORDER BY t.departureTime ASC")
    List<Trip> findOpenTripsInTimeRangeExcludingDestination(
            @Param("destinationCity") String destinationCity,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}
