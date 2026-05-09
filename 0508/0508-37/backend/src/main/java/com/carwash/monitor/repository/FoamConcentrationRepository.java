package com.carwash.monitor.repository;

import com.carwash.monitor.entity.FoamConcentration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FoamConcentrationRepository extends JpaRepository<FoamConcentration, Long> {

    List<FoamConcentration> findByMachineIdOrderByRecordTimeAsc(String machineId);

    List<FoamConcentration> findByMachineIdAndRecordTimeBetweenOrderByRecordTimeAsc(
            String machineId, LocalDateTime startTime, LocalDateTime endTime);

    List<FoamConcentration> findByRecordTimeBetweenOrderByRecordTimeAsc(
            LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT f FROM FoamConcentration f WHERE " +
           "(:machineId IS NULL OR f.machineId = :machineId) AND " +
           "f.recordTime BETWEEN :startTime AND :endTime " +
           "ORDER BY f.machineId ASC, f.recordTime ASC")
    List<FoamConcentration> findByConditions(
            @Param("machineId") String machineId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT f.machineId, COUNT(f) FROM FoamConcentration f " +
           "WHERE f.recordTime BETWEEN :startTime AND :endTime " +
           "GROUP BY f.machineId")
    List<Object[]> countTotalByTimeRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query(value = "SELECT machine_id AS machineId, " +
           "COUNT(*) AS abnormalCount, " +
           "SUM(CASE WHEN concentration > :maxNormal THEN 1 ELSE 0 END) AS overLimitCount, " +
           "SUM(CASE WHEN concentration < :minNormal THEN 1 ELSE 0 END) AS underLimitCount " +
           "FROM foam_concentration " +
           "WHERE record_time BETWEEN :startTime AND :endTime " +
           "AND concentration NOT BETWEEN :minNormal AND :maxNormal " +
           "GROUP BY machine_id",
           nativeQuery = true)
    List<Object[]> countAbnormalByTimeRange(
            @Param("minNormal") Double minNormal,
            @Param("maxNormal") Double maxNormal,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query(value = "SELECT machine_id AS machineId, COUNT(*) AS totalCount " +
           "FROM foam_concentration " +
           "WHERE record_time BETWEEN :startTime AND :endTime " +
           "GROUP BY machine_id",
           nativeQuery = true)
    List<Object[]> countTotalRecordsByTimeRangeNative(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
