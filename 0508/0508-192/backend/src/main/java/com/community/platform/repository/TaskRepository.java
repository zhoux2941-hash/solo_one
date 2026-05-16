package com.community.platform.repository;

import com.community.platform.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByStatus(String status);
    List<Task> findByPublisherId(Long publisherId);
    List<Task> findByAccepterId(Long accepterId);
    
    @Query("SELECT t FROM Task t WHERE t.status = 'PUBLISHED' ORDER BY t.createTime DESC")
    List<Task> findPublishedTasksOrderByCreateTimeDesc();

    Page<Task> findByPublisherId(Long publisherId, Pageable pageable);
    Page<Task> findByAccepterId(Long accepterId, Pageable pageable);
    
    @Query("SELECT t FROM Task t WHERE t.status = 'PUBLISHED' ORDER BY t.createTime DESC")
    Page<Task> findPublishedTasksOrderByCreateTimeDesc(Pageable pageable);
}
