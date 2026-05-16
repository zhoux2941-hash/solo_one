package com.bookdrift.controller;

import com.bookdrift.entity.CheckIn;
import com.bookdrift.service.CheckInService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/checkins")
@CrossOrigin(origins = "*")
public class CheckInController {

    @Autowired
    private CheckInService checkInService;

    @PostMapping
    public ResponseEntity<?> checkin(@RequestBody CheckIn checkIn) {
        try {
            CheckIn newCheckIn = checkInService.checkin(checkIn);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "打卡成功");
            result.put("data", newCheckIn);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @GetMapping("/drift/{driftId}")
    public ResponseEntity<?> getByDriftId(@PathVariable Long driftId) {
        List<CheckIn> checkins = checkInService.findByDriftId(driftId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", checkins);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<?> getByBookId(@PathVariable Long bookId) {
        List<CheckIn> checkins = checkInService.findByBookId(bookId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", checkins);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getByUserId(@PathVariable Long userId) {
        List<CheckIn> checkins = checkInService.findByUserId(userId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", checkins);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        CheckIn checkIn = checkInService.findById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", checkIn);
        return ResponseEntity.ok(result);
    }
}
