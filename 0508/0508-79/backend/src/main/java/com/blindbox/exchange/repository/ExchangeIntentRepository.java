package com.blindbox.exchange.repository;

import com.blindbox.exchange.entity.ExchangeIntent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExchangeIntentRepository extends JpaRepository<ExchangeIntent, Long> {
    List<ExchangeIntent> findByUserId(Long userId);
    List<ExchangeIntent> findByUserIdAndStatus(Long userId, String status);
    Page<ExchangeIntent> findByUserId(Long userId, Pageable pageable);
    
    @Query("SELECT e FROM ExchangeIntent e WHERE e.status = 'ACTIVE' " +
           "AND e.offerBox.isAvailable = true " +
           "AND e.desiredSeries LIKE %:series% " +
           "AND e.offerBox.seriesName LIKE %:offerSeries%")
    List<ExchangeIntent> findPotentialMatches(
            @Param("series") String series,
            @Param("offerSeries") String offerSeries);
    
    @Query("SELECT e FROM ExchangeIntent e WHERE e.status = 'ACTIVE' " +
           "AND e.offerBox.isAvailable = true " +
           "AND e.user.id != :userId " +
           "AND e.desiredSeries LIKE %:offerSeries% " +
           "AND e.offerBox.seriesName LIKE %:desiredSeries%")
    List<ExchangeIntent> findMatchingIntents(
            @Param("userId") Long userId,
            @Param("offerSeries") String offerSeries,
            @Param("desiredSeries") String desiredSeries);
    
    @Query("SELECT e FROM ExchangeIntent e WHERE e.offerBox.id = :boxId AND e.status = 'ACTIVE'")
    List<ExchangeIntent> findActiveIntentsByBoxId(@Param("boxId") Long boxId);
    
    @Query("SELECT e FROM ExchangeIntent e WHERE e.user.id = :userId AND e.offerBox.id = :boxId AND e.status = 'ACTIVE'")
    List<ExchangeIntent> findActiveIntentsByUserAndBox(@Param("userId") Long userId, @Param("boxId") Long boxId);
}
