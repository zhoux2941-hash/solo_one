package com.studentunion.budgetmanagement.repository;

import com.studentunion.budgetmanagement.entity.BudgetItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetItemRepository extends JpaRepository<BudgetItem, Long> {
    
    List<BudgetItem> findByActivityId(Long activityId);
    
    void deleteByActivityId(Long activityId);
}
