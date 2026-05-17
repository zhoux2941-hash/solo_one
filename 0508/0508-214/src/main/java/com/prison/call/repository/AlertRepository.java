package com.prison.call.repository;

import com.prison.call.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByStatus(String status);
    List<Alert> findByPrisonArea(String prisonArea);
    List<Alert> findByInmateId(Long inmateId);
    
    @Query(value = "SELECT CAST(a.created_at AS DATE) as date, COUNT(*) FROM alerts a " +
           "WHERE a.created_at >= :startDate GROUP BY CAST(a.created_at AS DATE) " +
           "ORDER BY date", nativeQuery = true)
    List<Object[]> countByDate(@Param("startDate") LocalDateTime startDate);
}
