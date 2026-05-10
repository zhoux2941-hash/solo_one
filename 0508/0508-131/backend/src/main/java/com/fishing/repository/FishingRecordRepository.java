package com.fishing.repository;

import com.fishing.entity.FishingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface FishingRecordRepository extends JpaRepository<FishingRecord, Long> {

    List<FishingRecord> findByUserIdOrderByFishDateDesc(Long userId);

    @Query("SELECT fr FROM FishingRecord fr WHERE " +
           "fr.waterTemp BETWEEN :minTemp AND :maxTemp " +
           "AND fr.airTemp BETWEEN :minAirTemp AND :maxAirTemp " +
           "ORDER BY fr.createdAt DESC")
    List<FishingRecord> findByTemperatureRange(
            @Param("minTemp") BigDecimal minTemp,
            @Param("maxTemp") BigDecimal maxTemp,
            @Param("minAirTemp") BigDecimal minAirTemp,
            @Param("maxAirTemp") BigDecimal maxAirTemp);

    @Query("SELECT fr FROM FishingRecord fr WHERE " +
           "MONTH(fr.fishDate) = :month")
    List<FishingRecord> findByMonth(@Param("month") Integer month);

    @Query("SELECT MONTH(fr.fishDate) as month, fr.fishSpeciesId as speciesId, " +
           "COUNT(fr.id) as count FROM FishingRecord fr " +
           "GROUP BY MONTH(fr.fishDate), fr.fishSpeciesId")
    List<Object[]> findMonthlySpeciesHeatmap();

    @Query("SELECT fr.lureId as lureId, COUNT(fr.id) as count, SUM(fr.catchCount) as totalCatch, " +
           "SUM(fr.releaseCount) as totalRelease, SUM(fr.ecoPointsEarned) as totalEcoPoints " +
           "FROM FishingRecord fr " +
           "WHERE fr.waterTemp BETWEEN :minTemp AND :maxTemp " +
           "AND fr.airTemp BETWEEN :minAirTemp AND :maxAirTemp " +
           "GROUP BY fr.lureId " +
           "ORDER BY totalCatch DESC " +
           "LIMIT 20")
    List<Object[]> findTopLuresByConditions(
            @Param("minTemp") BigDecimal minTemp,
            @Param("maxTemp") BigDecimal maxTemp,
            @Param("minAirTemp") BigDecimal minAirTemp,
            @Param("maxAirTemp") BigDecimal maxAirTemp);

    @Query("SELECT fr.lureId as lureId, COUNT(fr.id) as count, SUM(fr.catchCount) as totalCatch, " +
           "SUM(fr.releaseCount) as totalRelease, SUM(fr.ecoPointsEarned) as totalEcoPoints " +
           "FROM FishingRecord fr " +
           "WHERE fr.fishSpeciesId = :speciesId " +
           "AND fr.waterTemp BETWEEN :minTemp AND :maxTemp " +
           "AND fr.airTemp BETWEEN :minAirTemp AND :maxAirTemp " +
           "GROUP BY fr.lureId " +
           "ORDER BY totalCatch DESC " +
           "LIMIT 20")
    List<Object[]> findTopLuresBySpeciesAndConditions(
            @Param("speciesId") Long speciesId,
            @Param("minTemp") BigDecimal minTemp,
            @Param("maxTemp") BigDecimal maxTemp,
            @Param("minAirTemp") BigDecimal minAirTemp,
            @Param("maxAirTemp") BigDecimal maxAirTemp);
}
