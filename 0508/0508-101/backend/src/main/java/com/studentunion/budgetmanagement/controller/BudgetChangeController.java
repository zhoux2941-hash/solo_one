package com.studentunion.budgetmanagement.controller;

import com.studentunion.budgetmanagement.dto.BudgetChangeDTO;
import com.studentunion.budgetmanagement.service.BudgetChangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budget-changes")
@CrossOrigin("*")
public class BudgetChangeController {

    @Autowired
    private BudgetChangeService budgetChangeService;

    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<BudgetChangeDTO>> getChangesByActivityId(
            @PathVariable Long activityId) {
        List<BudgetChangeDTO> changes = budgetChangeService.getChangesByActivityId(activityId);
        return ResponseEntity.ok(changes);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<BudgetChangeDTO>> getPendingChanges() {
        List<BudgetChangeDTO> changes = budgetChangeService.getPendingChanges();
        return ResponseEntity.ok(changes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BudgetChangeDTO> getChangeById(@PathVariable Long id) {
        BudgetChangeDTO change = budgetChangeService.getChangeById(id);
        return ResponseEntity.ok(change);
    }

    @PostMapping("/activity/{activityId}")
    public ResponseEntity<BudgetChangeDTO> createChange(
            @PathVariable Long activityId,
            @RequestBody BudgetChangeDTO changeDTO) {
        BudgetChangeDTO createdChange = budgetChangeService.createChange(activityId, changeDTO);
        return ResponseEntity.ok(createdChange);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<BudgetChangeDTO> approveChange(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> requestBody) {
        Long reviewedBy = requestBody != null && requestBody.get("reviewedBy") != null
                ? Long.valueOf(requestBody.get("reviewedBy").toString())
                : 1L;
        String reviewReason = requestBody != null ? (String) requestBody.get("reviewReason") : null;
        
        BudgetChangeDTO approvedChange = budgetChangeService.approveChange(id, reviewedBy, reviewReason);
        return ResponseEntity.ok(approvedChange);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<BudgetChangeDTO> rejectChange(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestBody) {
        Long reviewedBy = requestBody.get("reviewedBy") != null
                ? Long.valueOf(requestBody.get("reviewedBy").toString())
                : 1L;
        String reviewReason = (String) requestBody.get("reviewReason");
        
        BudgetChangeDTO rejectedChange = budgetChangeService.rejectChange(id, reviewedBy, reviewReason);
        return ResponseEntity.ok(rejectedChange);
    }
}
