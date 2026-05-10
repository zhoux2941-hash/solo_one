package com.studentunion.budgetmanagement.repository;

import com.studentunion.budgetmanagement.entity.BudgetChange;
import com.studentunion.budgetmanagement.entity.ChangeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetChangeRepository extends JpaRepository<BudgetChange, Long> {
    
    List<BudgetChange> findByActivityIdOrderByCreatedAtDesc(Long activityId);
    
    List<BudgetChange> findByStatus(ChangeStatus status);
    
    List<BudgetChange> findByActivityIdAndStatus(Long activityId, ChangeStatus status);
    
    boolean existsByActivityIdAndStatus(Long activityId, ChangeStatus status);
}
