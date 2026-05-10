package com.graftingassistant.controller;

import com.graftingassistant.entity.CareReminder;
import com.graftingassistant.entity.GraftingReminder;
import com.graftingassistant.entity.PhenologyStage;
import com.graftingassistant.service.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ReminderController {
    
    private final ReminderService reminderService;
    
    @GetMapping("/stages")
    public ResponseEntity<List<PhenologyStage>> getAllStages() {
        return ResponseEntity.ok(reminderService.getAllStages());
    }
    
    @GetMapping("/care")
    public ResponseEntity<List<CareReminder>> getAllCareReminders() {
        return ResponseEntity.ok(reminderService.getAllCareReminders());
    }
    
    @PostMapping("/generate/{recordId}")
    public ResponseEntity<List<GraftingReminder>> generateReminders(@PathVariable Long recordId) {
        return ResponseEntity.ok(reminderService.generateRemindersForRecord(recordId));
    }
    
    @GetMapping("/record/{recordId}")
    public ResponseEntity<List<GraftingReminder>> getRemindersByRecord(@PathVariable Long recordId) {
        return ResponseEntity.ok(reminderService.getRemindersByRecord(recordId));
    }
    
    @GetMapping("/pending/{recordId}")
    public ResponseEntity<List<GraftingReminder>> getPendingRemindersByRecord(@PathVariable Long recordId) {
        return ResponseEntity.ok(reminderService.getPendingRemindersByRecord(recordId));
    }
    
    @GetMapping("/today")
    public ResponseEntity<List<GraftingReminder>> getTodayReminders() {
        return ResponseEntity.ok(reminderService.getTodayReminders());
    }
    
    @GetMapping("/upcoming")
    public ResponseEntity<List<GraftingReminder>> getUpcomingReminders(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(reminderService.getUpcomingReminders(days));
    }
    
    @PutMapping("/{id}/complete")
    public ResponseEntity<GraftingReminder> completeReminder(
            @PathVariable Long id,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(reminderService.completeReminder(id, notes));
    }
    
    @PutMapping("/{id}/dismiss")
    public ResponseEntity<GraftingReminder> dismissReminder(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.dismissReminder(id));
    }
    
    @GetMapping("/current-stage")
    public ResponseEntity<Map<String, String>> getCurrentStage(@RequestParam String graftingDate) {
        java.time.LocalDate date = java.time.LocalDate.parse(graftingDate);
        String stageName = reminderService.getCurrentStageName(date);
        
        Map<String, String> response = new HashMap<>();
        response.put("currentStage", stageName);
        response.put("graftingDate", graftingDate);
        
        return ResponseEntity.ok(response);
    }
}
