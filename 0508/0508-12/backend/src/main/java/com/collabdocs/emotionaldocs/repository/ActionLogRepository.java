package com.collabdocs.emotionaldocs.repository;

import com.collabdocs.emotionaldocs.entity.ActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActionLogRepository extends JpaRepository<ActionLog, Long> {
    List<ActionLog> findByDocIdOrderByTimestampDesc(Long docId);
    List<ActionLog> findByDocIdAndUserIdOrderByTimestampDesc(Long docId, Long userId);
    List<ActionLog> findByDocIdAndTimestampBetweenOrderByTimestampAsc(Long docId, LocalDateTime start, LocalDateTime end);
}
