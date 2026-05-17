package com.scenic.repository;

import com.scenic.entity.MaterialRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRecordRepository extends JpaRepository<MaterialRecord, Long> {

    Optional<MaterialRecord> findByRecordCode(String recordCode);

    @Query("SELECT r FROM MaterialRecord r WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR r.recordCode LIKE %:keyword% OR r.material.materialName LIKE %:keyword%) AND " +
           "(:recordType IS NULL OR :recordType = '' OR r.recordType = :recordType) AND " +
           "(:materialId IS NULL OR r.material.id = :materialId) AND " +
           "(:startTime IS NULL OR r.createTime >= :startTime) AND " +
           "(:endTime IS NULL OR r.createTime <= :endTime)")
    Page<MaterialRecord> findByConditions(
            @Param("keyword") String keyword,
            @Param("recordType") String recordType,
            @Param("materialId") Long materialId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);

    @Query("SELECT r FROM MaterialRecord r WHERE r.material.id = :materialId ORDER BY r.createTime DESC")
    List<MaterialRecord> findByMaterialIdOrderByCreateTimeDesc(@Param("materialId") Long materialId);

    List<MaterialRecord> findByRecordType(String recordType);

    boolean existsByRecordCode(String recordCode);
}
