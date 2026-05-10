package com.construction.progress.repository;

import com.construction.progress.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByUserIdOrderByCreateTimeDesc(Long userId);
    
    List<Message> findByUserIdAndIsReadOrderByCreateTimeDesc(Long userId, Boolean isRead);
    
    long countByUserIdAndIsRead(Long userId, Boolean isRead);
    
    List<Message> findByProjectIdOrderByCreateTimeDesc(Long projectId);
    
    @Query("SELECT m FROM Message m WHERE m.projectId = :projectId AND m.stageIndex = :stageIndex AND m.type = 'WARNING' ORDER BY m.createTime DESC")
    List<Message> findLatestWarningByProjectAndStage(
            @Param("projectId") Long projectId, 
            @Param("stageIndex") Integer stageIndex);
}
