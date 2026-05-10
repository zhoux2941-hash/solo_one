package com.studentunion.budgetmanagement.controller;

import com.studentunion.budgetmanagement.dto.ActivityDTO;
import com.studentunion.budgetmanagement.dto.DepartmentStatsDTO;
import com.studentunion.budgetmanagement.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin("*")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @GetMapping
    public ResponseEntity<List<ActivityDTO>> getAllActivities(
            @RequestParam(required = false) String department) {
        List<ActivityDTO> activities;
        if (department != null && !department.isEmpty()) {
            activities = activityService.getActivitiesByDepartment(department);
        } else {
            activities = activityService.getAllActivities();
        }
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityDTO> getActivityById(@PathVariable Long id) {
        ActivityDTO activity = activityService.getActivityById(id);
        return ResponseEntity.ok(activity);
    }

    @PostMapping
    public ResponseEntity<ActivityDTO> createActivity(@RequestBody ActivityDTO activityDTO) {
        ActivityDTO createdActivity = activityService.createActivity(activityDTO);
        return ResponseEntity.ok(createdActivity);
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<ActivityDTO> submitActual(
            @PathVariable Long id,
            @RequestBody ActivityDTO activityDTO) {
        ActivityDTO updatedActivity = activityService.submitActual(id, activityDTO);
        return ResponseEntity.ok(updatedActivity);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ActivityDTO> approveActivity(@PathVariable Long id) {
        ActivityDTO approvedActivity = activityService.approveActivity(id);
        return ResponseEntity.ok(approvedActivity);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ActivityDTO> rejectActivity(@PathVariable Long id) {
        ActivityDTO rejectedActivity = activityService.rejectActivity(id);
        return ResponseEntity.ok(rejectedActivity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteActivity(@PathVariable Long id) {
        activityService.deleteActivity(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Activity deleted successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/departments")
    public ResponseEntity<List<String>> getAllDepartments() {
        List<String> departments = activityService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    @GetMapping("/stats")
    public ResponseEntity<List<DepartmentStatsDTO>> getDepartmentStats(
            @RequestParam(required = false) String department) {
        List<DepartmentStatsDTO> stats = activityService.getDepartmentStats(department);
        return ResponseEntity.ok(stats);
    }
}
