package com.company.training.controller;

import com.company.training.entity.Enrollment;
import com.company.training.service.EnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enrollments")
@CrossOrigin(origins = "*")
public class EnrollmentController {

    @Autowired
    private EnrollmentService enrollmentService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Map<String, Object>> getEnrollmentsByCourse(@PathVariable Long courseId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Enrollment> enrollments = enrollmentService.getEnrollmentsByCourse(courseId);
            response.put("success", true);
            response.put("data", enrollments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<Map<String, Object>> getEnrollmentsByEmployee(@PathVariable Long employeeId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Enrollment> enrollments = enrollmentService.getEnrollmentsByEmployee(employeeId);
            response.put("success", true);
            response.put("data", enrollments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/count/{courseId}")
    public ResponseEntity<Map<String, Object>> getEnrolledCount(@PathVariable Long courseId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer count = enrollmentService.getEnrolledCount(courseId);
            response.put("success", true);
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> enrollCourse(@RequestBody Map<String, Long> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long courseId = request.get("courseId");
            Long employeeId = request.get("employeeId");
            Enrollment enrollment = enrollmentService.enrollCourse(courseId, employeeId);
            response.put("success", true);
            response.put("message", "报名成功");
            response.put("data", enrollment);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/cancel/{enrollmentId}")
    public ResponseEntity<Map<String, Object>> cancelEnrollment(@PathVariable Long enrollmentId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Enrollment enrollment = enrollmentService.cancelEnrollment(enrollmentId);
            response.put("success", true);
            response.put("message", "取消报名成功");
            response.put("data", enrollment);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkEnrollment(@RequestParam Long courseId, @RequestParam Long employeeId) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean enrolled = enrollmentService.getEnrollment(courseId, employeeId)
                    .map(e -> "ENROLLED".equals(e.getStatus()))
                    .orElse(false);
            response.put("success", true);
            response.put("enrolled", enrolled);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
