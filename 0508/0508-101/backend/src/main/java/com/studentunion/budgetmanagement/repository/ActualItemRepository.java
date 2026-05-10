package com.studentunion.budgetmanagement.repository;

import com.studentunion.budgetmanagement.entity.ActualItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActualItemRepository extends JpaRepository<ActualItem, Long> {
    
    List<ActualItem> findByActivityId(Long activityId);
    
    void deleteByActivityId(Long activityId);
}
