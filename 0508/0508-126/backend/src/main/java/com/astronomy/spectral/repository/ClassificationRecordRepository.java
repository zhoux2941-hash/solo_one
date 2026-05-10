package com.astronomy.spectral.repository;

import com.astronomy.spectral.model.ClassificationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassificationRecordRepository extends JpaRepository<ClassificationRecord, Long> {
    
    List<ClassificationRecord> findByUserIdOrderByCreatedAtDesc(String userId);
    
    @Query("SELECT COUNT(c) FROM ClassificationRecord c WHERE c.userId = :userId")
    long countByUserId(String userId);
    
    @Query("SELECT COUNT(c) FROM ClassificationRecord c WHERE c.userId = :userId AND c.isCorrect = true")
    long countCorrectByUserId(String userId);
}
