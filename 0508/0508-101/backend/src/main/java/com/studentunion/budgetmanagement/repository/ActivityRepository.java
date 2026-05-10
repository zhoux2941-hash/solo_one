package com.studentunion.budgetmanagement.repository;

import com.studentunion.budgetmanagement.entity.Activity;
import com.studentunion.budgetmanagement.entity.ActivityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    
    List<Activity> findByDepartment(String department);
    
    List<Activity> findByStatus(ActivityStatus status);
    
    List<Activity> findByDepartmentAndStatus(String department, ActivityStatus status);
    
    @Query("SELECT DISTINCT a.department FROM Activity a")
    List<String> findAllDepartments();
    
    @Query("SELECT a FROM Activity a ORDER BY a.createdAt DESC")
    List<Activity> findAllOrderByCreatedAtDesc();
}
