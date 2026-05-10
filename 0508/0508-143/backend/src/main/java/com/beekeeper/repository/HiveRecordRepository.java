package com.beekeeper.repository;

import com.beekeeper.entity.HiveRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HiveRecordRepository extends JpaRepository<HiveRecord, Long> {
    List<HiveRecord> findByBeehiveIdOrderByRecordDateDesc(Long beehiveId);
    
    @Query("SELECT r FROM HiveRecord r WHERE r.beehive.id = :beehiveId AND r.recordDate BETWEEN :startDate AND :endDate ORDER BY r.recordDate ASC")
    List<HiveRecord> findByBeehiveIdAndRecordDateBetween(
            @Param("beehiveId") Long beehiveId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    Optional<HiveRecord> findByBeehiveIdAndRecordDate(Long beehiveId, LocalDate recordDate);
    
    boolean existsByBeehiveIdAndRecordDate(Long beehiveId, LocalDate recordDate);
    
    @Query("SELECT r FROM HiveRecord r WHERE r.beehive.id IN :beehiveIds AND r.recordDate BETWEEN :startDate AND :endDate ORDER BY r.recordDate ASC")
    List<HiveRecord> findByBeehiveIdsAndRecordDateBetween(
            @Param("beehiveIds") List<Long> beehiveIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
