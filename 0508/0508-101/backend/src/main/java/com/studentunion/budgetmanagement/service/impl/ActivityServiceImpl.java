package com.studentunion.budgetmanagement.service.impl;

import com.studentunion.budgetmanagement.dto.ActivityDTO;
import com.studentunion.budgetmanagement.dto.ActualItemDTO;
import com.studentunion.budgetmanagement.dto.BudgetItemDTO;
import com.studentunion.budgetmanagement.dto.DepartmentStatsDTO;
import com.studentunion.budgetmanagement.entity.ActualItem;
import com.studentunion.budgetmanagement.entity.Activity;
import com.studentunion.budgetmanagement.entity.ActivityStatus;
import com.studentunion.budgetmanagement.entity.BudgetItem;
import com.studentunion.budgetmanagement.repository.ActualItemRepository;
import com.studentunion.budgetmanagement.repository.ActivityRepository;
import com.studentunion.budgetmanagement.repository.BudgetItemRepository;
import com.studentunion.budgetmanagement.service.ActivityService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ActivityServiceImpl implements ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private BudgetItemRepository budgetItemRepository;

    @Autowired
    private ActualItemRepository actualItemRepository;

    @Override
    @Cacheable(value = "activities", key = "'all'")
    public List<ActivityDTO> getAllActivities() {
        return activityRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "activities", key = "#department")
    public List<ActivityDTO> getActivitiesByDepartment(String department) {
        return activityRepository.findByDepartment(department).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "activity", key = "#id")
    public ActivityDTO getActivityById(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found: " + id));
        return convertToDTO(activity);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "activities", allEntries = true),
            @CacheEvict(value = "departmentStats", allEntries = true)
    })
    public ActivityDTO createActivity(ActivityDTO activityDTO) {
        Activity activity = new Activity();
        activity.setName(activityDTO.getName());
        activity.setDepartment(activityDTO.getDepartment());
        activity.setBudgetTotal(activityDTO.getBudgetTotal());
        activity.setCreatedBy(activityDTO.getCreatedBy() != null ? activityDTO.getCreatedBy() : 1L);
        activity.setStatus(ActivityStatus.CREATED);
        activity.setActualTotal(BigDecimal.ZERO);

        if (activityDTO.getBudgetItems() != null) {
            for (BudgetItemDTO itemDTO : activityDTO.getBudgetItems()) {
                BudgetItem item = new BudgetItem();
                item.setItemName(itemDTO.getItemName());
                item.setAmount(itemDTO.getAmount());
                activity.addBudgetItem(item);
            }
        }

        Activity savedActivity = activityRepository.save(activity);
        return convertToDTO(savedActivity);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "activities", allEntries = true),
            @CacheEvict(value = "activity", key = "#id"),
            @CacheEvict(value = "departmentStats", allEntries = true)
    })
    public ActivityDTO submitActual(Long id, ActivityDTO activityDTO) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found: " + id));

        if (activity.getStatus() != ActivityStatus.CREATED && activity.getStatus() != ActivityStatus.REJECTED) {
            throw new RuntimeException("Cannot submit actual for activity in status: " + activity.getStatus());
        }

        activity.getActualItems().clear();
        BigDecimal actualTotal = BigDecimal.ZERO;

        if (activityDTO.getActualItems() != null) {
            for (ActualItemDTO itemDTO : activityDTO.getActualItems()) {
                ActualItem item = new ActualItem();
                item.setItemName(itemDTO.getItemName());
                item.setAmount(itemDTO.getAmount());
                activity.addActualItem(item);
                actualTotal = actualTotal.add(itemDTO.getAmount());
            }
        }

        activity.setActualTotal(actualTotal);
        activity.setStatus(ActivityStatus.SUBMITTED);

        Activity savedActivity = activityRepository.save(activity);
        return convertToDTO(savedActivity);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "activities", allEntries = true),
            @CacheEvict(value = "activity", key = "#id"),
            @CacheEvict(value = "departmentStats", allEntries = true)
    })
    public ActivityDTO approveActivity(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found: " + id));

        if (activity.getStatus() != ActivityStatus.SUBMITTED) {
            throw new RuntimeException("Cannot approve activity in status: " + activity.getStatus());
        }

        activity.setStatus(ActivityStatus.CLOSED);
        Activity savedActivity = activityRepository.save(activity);
        return convertToDTO(savedActivity);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "activities", allEntries = true),
            @CacheEvict(value = "activity", key = "#id"),
            @CacheEvict(value = "departmentStats", allEntries = true)
    })
    public ActivityDTO rejectActivity(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found: " + id));

        if (activity.getStatus() != ActivityStatus.SUBMITTED) {
            throw new RuntimeException("Cannot reject activity in status: " + activity.getStatus());
        }

        activity.setStatus(ActivityStatus.REJECTED);
        Activity savedActivity = activityRepository.save(activity);
        return convertToDTO(savedActivity);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "activities", allEntries = true),
            @CacheEvict(value = "activity", key = "#id"),
            @CacheEvict(value = "departmentStats", allEntries = true)
    })
    public void deleteActivity(Long id) {
        if (!activityRepository.existsById(id)) {
            throw new RuntimeException("Activity not found: " + id);
        }
        activityRepository.deleteById(id);
    }

    @Override
    public List<String> getAllDepartments() {
        return activityRepository.findAllDepartments();
    }

    @Override
    @Cacheable(value = "departmentStats", key = "#department ?: 'all'")
    public List<DepartmentStatsDTO> getDepartmentStats(String department) {
        List<Activity> activities;
        if (department != null && !department.isEmpty()) {
            activities = activityRepository.findByDepartment(department);
        } else {
            activities = activityRepository.findAll();
        }

        Map<String, BigDecimal> budgetMap = new HashMap<>();
        Map<String, BigDecimal> actualMap = new HashMap<>();

        for (Activity activity : activities) {
            String dept = activity.getDepartment();
            budgetMap.merge(dept, activity.getBudgetTotal(), BigDecimal::add);
            actualMap.merge(dept, activity.getActualTotal(), BigDecimal::add);
        }

        List<DepartmentStatsDTO> stats = new ArrayList<>();
        for (String dept : budgetMap.keySet()) {
            BigDecimal totalBudget = budgetMap.get(dept);
            BigDecimal totalActual = actualMap.getOrDefault(dept, BigDecimal.ZERO);
            BigDecimal executionRate = totalBudget.compareTo(BigDecimal.ZERO) > 0
                    ? totalActual.multiply(new BigDecimal("100")).divide(totalBudget, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            stats.add(new DepartmentStatsDTO(dept, totalBudget, totalActual, executionRate));
        }

        return stats;
    }

    private ActivityDTO convertToDTO(Activity activity) {
        ActivityDTO dto = new ActivityDTO();
        BeanUtils.copyProperties(activity, dto);
        dto.setStatus(activity.getStatus().name());

        if (activity.getBudgetItems() != null) {
            dto.setBudgetItems(activity.getBudgetItems().stream().map(item -> {
                BudgetItemDTO itemDTO = new BudgetItemDTO();
                itemDTO.setId(item.getId());
                itemDTO.setItemName(item.getItemName());
                itemDTO.setAmount(item.getAmount());
                return itemDTO;
            }).collect(Collectors.toList()));
        }

        if (activity.getActualItems() != null) {
            dto.setActualItems(activity.getActualItems().stream().map(item -> {
                ActualItemDTO itemDTO = new ActualItemDTO();
                itemDTO.setId(item.getId());
                itemDTO.setItemName(item.getItemName());
                itemDTO.setAmount(item.getAmount());
                return itemDTO;
            }).collect(Collectors.toList()));
        }

        return dto;
    }
}
