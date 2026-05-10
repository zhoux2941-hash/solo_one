package com.office.plantreminder.repository;

import com.office.plantreminder.entity.WateringLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WateringLogRepository extends JpaRepository<WateringLog, Long> {
    List<WateringLog> findByPlantIdOrderByWateredAtDesc(Long plantId);

    @Query("SELECT w.wateredBy AS username, COUNT(w) AS wateringCount " +
           "FROM WateringLog w WHERE w.wateredAt >= :since " +
           "GROUP BY w.wateredBy ORDER BY wateringCount DESC")
    List<Object[]> countWateringsByUserSince(LocalDateTime since);
}
