package com.petclean.repository;

import com.petclean.entity.CleaningRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CleaningRecordRepository extends JpaRepository<CleaningRecord, Long> {

    List<CleaningRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<CleaningRecord> findByCleaningPointIdOrderByCreatedAtDesc(Long cleaningPointId);

    @Query("SELECT SUM(cr.pointsEarned) FROM CleaningRecord cr WHERE cr.buildingId = :buildingId")
    Integer sumPointsByBuildingId(@Param("buildingId") Long buildingId);

    @Query("SELECT COUNT(cr) FROM CleaningRecord cr WHERE cr.buildingId = :buildingId")
    Long countByBuildingId(@Param("buildingId") Long buildingId);
}
