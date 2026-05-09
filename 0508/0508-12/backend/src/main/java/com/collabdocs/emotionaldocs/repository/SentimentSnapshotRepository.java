package com.collabdocs.emotionaldocs.repository;

import com.collabdocs.emotionaldocs.entity.SentimentSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SentimentSnapshotRepository extends JpaRepository<SentimentSnapshot, Long> {
    List<SentimentSnapshot> findByDocIdOrderByTimestampAsc(Long docId);
    List<SentimentSnapshot> findByDocIdAndUserIdOrderByTimestampAsc(Long docId, Long userId);
    
    @Query("SELECT s FROM SentimentSnapshot s WHERE s.docId = :docId AND s.timestamp BETWEEN :start AND :end ORDER BY s.timestamp ASC")
    List<SentimentSnapshot> findByDocIdAndTimestampBetween(
            @Param("docId") Long docId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
    
    @Query("SELECT COUNT(s) > 0 FROM SentimentSnapshot s WHERE s.docId = :docId AND s.userId = :userId AND s.timestamp > :threshold")
    boolean existsRecentSnapshotByDocIdAndUserId(
            @Param("docId") Long docId,
            @Param("userId") Long userId,
            @Param("threshold") LocalDateTime threshold
    );
}
