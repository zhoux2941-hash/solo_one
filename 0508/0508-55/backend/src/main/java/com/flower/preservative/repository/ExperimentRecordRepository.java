package com.flower.preservative.repository;

import com.flower.preservative.entity.ExperimentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExperimentRecordRepository extends JpaRepository<ExperimentRecord, Long> {
    List<ExperimentRecord> findBySessionIdOrderByCreatedAtDesc(String sessionId);
    
    List<ExperimentRecord> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<ExperimentRecord> findBySessionIdAndFlowerTypeOrderByCreatedAtDesc(String sessionId, String flowerType);
    
    void deleteByExpiresAtBefore(LocalDateTime now);
}
