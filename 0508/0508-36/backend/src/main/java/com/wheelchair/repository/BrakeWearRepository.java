package com.wheelchair.repository;

import com.wheelchair.entity.BrakeWearRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BrakeWearRepository extends JpaRepository<BrakeWearRecord, Long> {

    Optional<BrakeWearRecord> findFirstByWheelchairIdOrderByRecordDateDesc(String wheelchairId);

    List<BrakeWearRecord> findByWheelchairIdAndRecordDateBetweenOrderByRecordDateDesc(
            String wheelchairId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT AVG(b.wearValue) FROM BrakeWearRecord b WHERE b.wheelchairId = :wheelchairId " +
           "AND b.recordDate >= :startDate AND b.recordDate <= :endDate")
    Double findAverageWearByWheelchairIdAndDateBetween(
            @Param("wheelchairId") String wheelchairId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT b FROM BrakeWearRecord b WHERE b.wheelchairId = :wheelchairId AND b.recordDate <= :date ORDER BY b.recordDate DESC LIMIT 1")
    Optional<BrakeWearRecord> findLatestByWheelchairIdBeforeDate(
            @Param("wheelchairId") String wheelchairId,
            @Param("date") LocalDate date);

    @Query("SELECT DISTINCT b.wheelchairId FROM BrakeWearRecord b ORDER BY b.wheelchairId")
    List<String> findAllWheelchairIds();

    @Query("SELECT b FROM BrakeWearRecord b WHERE b.recordDate = (SELECT MAX(b2.recordDate) FROM BrakeWearRecord b2 WHERE b2.wheelchairId = b.wheelchairId)")
    List<BrakeWearRecord> findLatestRecordsForAllWheelchairs();

    @Query(value = "SELECT AVG(wear_value) FROM brake_wear_record " +
                   "WHERE wheelchair_id = :wheelchairId " +
                   "AND record_date BETWEEN DATE_SUB(:currentDate, INTERVAL 1 MONTH) " +
                   "AND DATE_SUB(:currentDate, INTERVAL 1 DAY)", 
           nativeQuery = true)
    Double findLastMonthAverageWear(
            @Param("wheelchairId") String wheelchairId,
            @Param("currentDate") LocalDate currentDate);

    @Query(value = "SELECT AVG(wear_value) FROM brake_wear_record " +
                   "WHERE wheelchair_id = :wheelchairId " +
                   "AND record_date BETWEEN DATE_SUB(:currentDate, INTERVAL 1 MONTH) " +
                   "AND :currentDate", 
           nativeQuery = true)
    Double findCurrentMonthAverageWear(
            @Param("wheelchairId") String wheelchairId,
            @Param("currentDate") LocalDate currentDate);
}
