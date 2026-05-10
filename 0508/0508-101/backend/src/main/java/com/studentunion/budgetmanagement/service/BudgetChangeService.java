package com.studentunion.budgetmanagement.service;

import com.studentunion.budgetmanagement.dto.BudgetChangeDTO;

import java.util.List;

public interface BudgetChangeService {
    
    List<BudgetChangeDTO> getChangesByActivityId(Long activityId);
    
    List<BudgetChangeDTO> getPendingChanges();
    
    BudgetChangeDTO getChangeById(Long id);
    
    BudgetChangeDTO createChange(Long activityId, BudgetChangeDTO changeDTO);
    
    BudgetChangeDTO approveChange(Long id, Long reviewedBy, String reviewReason);
    
    BudgetChangeDTO rejectChange(Long id, Long reviewedBy, String reviewReason);
}
