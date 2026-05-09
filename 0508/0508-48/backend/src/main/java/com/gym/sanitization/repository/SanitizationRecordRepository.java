package com.gym.sanitization.repository;

import com.gym.sanitization.entity.SanitizationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SanitizationRecordRepository extends JpaRepository<SanitizationRecord, Long> {

    Optional<SanitizationRecord> findFirstByEquipmentIdOrderBySanitizationTimeDesc(Long equipmentId);

    List<SanitizationRecord> findByEquipmentIdAndSanitizationTimeBetween(Long equipmentId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT r FROM SanitizationRecord r WHERE r.equipmentId = :equipmentId AND FUNCTION('DATE', r.sanitizationTime) = FUNCTION('DATE', :date) ORDER BY r.sanitizationTime DESC")
    List<SanitizationRecord> findByEquipmentIdAndDate(@Param("equipmentId") Long equipmentId, @Param("date") LocalDateTime date);

    @Query("SELECT COUNT(r) FROM SanitizationRecord r WHERE r.equipmentId = :equipmentId AND r.sanitizationTime BETWEEN :start AND :end")
    int countByEquipmentIdAndTimeBetween(@Param("equipmentId") Long equipmentId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT r FROM SanitizationRecord r WHERE r.sanitizationTime BETWEEN :start AND :end ORDER BY r.sanitizationTime ASC")
    List<SanitizationRecord> findByTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
