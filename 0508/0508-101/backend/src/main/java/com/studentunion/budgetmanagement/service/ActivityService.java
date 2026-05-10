package com.studentunion.budgetmanagement.service;

import com.studentunion.budgetmanagement.dto.ActivityDTO;
import com.studentunion.budgetmanagement.dto.DepartmentStatsDTO;

import java.util.List;

public interface ActivityService {
    
    List<ActivityDTO> getAllActivities();
    
    List<ActivityDTO> getActivitiesByDepartment(String department);
    
    ActivityDTO getActivityById(Long id);
    
    ActivityDTO createActivity(ActivityDTO activityDTO);
    
    ActivityDTO submitActual(Long id, ActivityDTO activityDTO);
    
    ActivityDTO approveActivity(Long id);
    
    ActivityDTO rejectActivity(Long id);
    
    void deleteActivity(Long id);
    
    List<String> getAllDepartments();
    
    List<DepartmentStatsDTO> getDepartmentStats(String department);
}
