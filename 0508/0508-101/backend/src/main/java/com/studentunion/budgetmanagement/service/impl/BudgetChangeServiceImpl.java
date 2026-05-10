package com.studentunion.budgetmanagement.service.impl;

import com.studentunion.budgetmanagement.dto.BudgetChangeDTO;
import com.studentunion.budgetmanagement.entity.Activity;
import com.studentunion.budgetmanagement.entity.ActivityStatus;
import com.studentunion.budgetmanagement.entity.BudgetChange;
import com.studentunion.budgetmanagement.entity.ChangeStatus;
import com.studentunion.budgetmanagement.repository.ActivityRepository;
import com.studentunion.budgetmanagement.repository.BudgetChangeRepository;
import com.studentunion.budgetmanagement.service.BudgetChangeService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BudgetChangeServiceImpl implements BudgetChangeService {

    @Autowired
    private BudgetChangeRepository budgetChangeRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Override
    public List<BudgetChangeDTO> getChangesByActivityId(Long activityId) {
        return budgetChangeRepository.findByActivityIdOrderByCreatedAtDesc(activityId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BudgetChangeDTO> getPendingChanges() {
        return budgetChangeRepository.findByStatus(ChangeStatus.PENDING).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public BudgetChangeDTO getChangeById(Long id) {
        BudgetChange change = budgetChangeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget change not found: " + id));
        return convertToDTO(change);
    }

    @Override
    @Transactional
    public BudgetChangeDTO createChange(Long activityId, BudgetChangeDTO changeDTO) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found: " + activityId));

        if (activity.getStatus() == ActivityStatus.CLOSED) {
            throw new RuntimeException("Cannot change budget for closed activity");
        }

        if (budgetChangeRepository.existsByActivityIdAndStatus(activityId, ChangeStatus.PENDING)) {
            throw new RuntimeException("There is already a pending budget change for this activity");
        }

        BudgetChange change = new BudgetChange();
        change.setActivityId(activityId);
        change.setOriginalBudget(activity.getBudgetTotal());
        change.setNewBudget(changeDTO.getNewBudget());
        change.setChangeAmount(changeDTO.getNewBudget().subtract(activity.getBudgetTotal()));
        change.setReason(changeDTO.getReason());
        change.setStatus(ChangeStatus.PENDING);
        change.setCreatedBy(changeDTO.getCreatedBy() != null ? changeDTO.getCreatedBy() : 1L);

        BudgetChange savedChange = budgetChangeRepository.save(change);
        return convertToDTO(savedChange);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "activities", allEntries = true),
            @CacheEvict(value = "activity", allEntries = true),
            @CacheEvict(value = "departmentStats", allEntries = true)
    })
    public BudgetChangeDTO approveChange(Long id, Long reviewedBy, String reviewReason) {
        BudgetChange change = budgetChangeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget change not found: " + id));

        if (change.getStatus() != ChangeStatus.PENDING) {
            throw new RuntimeException("Cannot approve change in status: " + change.getStatus());
        }

        change.setStatus(ChangeStatus.APPROVED);
        change.setReviewedBy(reviewedBy);
        change.setReviewReason(reviewReason);
        change.setReviewedAt(LocalDateTime.now());

        Activity activity = activityRepository.findById(change.getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found: " + change.getActivityId()));
        activity.setBudgetTotal(change.getNewBudget());
        activityRepository.save(activity);

        BudgetChange savedChange = budgetChangeRepository.save(change);
        return convertToDTO(savedChange);
    }

    @Override
    @Transactional
    public BudgetChangeDTO rejectChange(Long id, Long reviewedBy, String reviewReason) {
        BudgetChange change = budgetChangeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget change not found: " + id));

        if (change.getStatus() != ChangeStatus.PENDING) {
            throw new RuntimeException("Cannot reject change in status: " + change.getStatus());
        }

        if (reviewReason == null || reviewReason.trim().isEmpty()) {
            throw new RuntimeException("Review reason is required for rejection");
        }

        change.setStatus(ChangeStatus.REJECTED);
        change.setReviewedBy(reviewedBy);
        change.setReviewReason(reviewReason);
        change.setReviewedAt(LocalDateTime.now());

        BudgetChange savedChange = budgetChangeRepository.save(change);
        return convertToDTO(savedChange);
    }

    private BudgetChangeDTO convertToDTO(BudgetChange change) {
        BudgetChangeDTO dto = new BudgetChangeDTO();
        BeanUtils.copyProperties(change, dto);
        dto.setStatus(change.getStatus().name());
        return dto;
    }
}
