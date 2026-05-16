package com.company.training.controller;

import com.company.training.entity.Attendance;
import com.company.training.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendances")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Map<String, Object>> getAttendancesByCourse(@PathVariable Long courseId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Attendance> attendances = attendanceService.getAttendancesByCourse(courseId);
            response.put("success", true);
            response.put("data", attendances);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<Map<String, Object>> getAttendancesByEmployee(@PathVariable Long employeeId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Attendance> attendances = attendanceService.getAttendancesByEmployee(employeeId);
            response.put("success", true);
            response.put("data", attendances);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/count/{courseId}")
    public ResponseEntity<Map<String, Object>> getSignedInCount(@PathVariable Long courseId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer count = attendanceService.getSignedInCount(courseId);
            response.put("success", true);
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<Map<String, Object>> signIn(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long courseId = Long.valueOf(request.get("courseId").toString());
            Long employeeId = Long.valueOf(request.get("employeeId").toString());
            String location = (String) request.get("location");
            String remarks = (String) request.get("remarks");
            Attendance attendance = attendanceService.signIn(courseId, employeeId, location, remarks);
            response.put("success", true);
            response.put("message", "签到成功");
            response.put("data", attendance);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkAttendance(@RequestParam Long courseId, @RequestParam Long employeeId) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean signedIn = attendanceService.getAttendance(courseId, employeeId)
                    .map(Attendance::getSignedIn)
                    .orElse(false);
            response.put("success", true);
            response.put("signedIn", signedIn);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
