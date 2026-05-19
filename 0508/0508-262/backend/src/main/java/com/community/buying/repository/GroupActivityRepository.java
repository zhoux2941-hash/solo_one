package com.community.buying.repository;

import com.community.buying.entity.GroupActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GroupActivityRepository extends JpaRepository<GroupActivity, Long> {
    List<GroupActivity> findByStatus(Integer status);
    
    @Query("SELECT g FROM GroupActivity g WHERE g.status = 1 AND g.startTime <= ?1 AND g.endTime >= ?1")
    List<GroupActivity> findActiveActivities(LocalDateTime now);
    
    List<GroupActivity> findByProductIdAndStatus(Long productId, Integer status);
}