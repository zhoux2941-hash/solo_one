package com.lawfirm.caseManagement.controller;

import com.lawfirm.caseManagement.entity.Case;
import com.lawfirm.caseManagement.entity.Hearing;
import com.lawfirm.caseManagement.entity.Judgment;
import com.lawfirm.caseManagement.service.CaseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cases")
@CrossOrigin(origins = "*")
public class CaseController {

    @Autowired
    private CaseService caseService;

    @GetMapping
    public List<Case> getAllCases() {
        return caseService.getAllCases();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Case> getCaseById(@PathVariable Long id) {
        return caseService.getCaseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createCase(@Valid @RequestBody Case caseEntity) {
        try {
            Case createdCase = caseService.createCase(caseEntity);
            return ResponseEntity.ok(createdCase);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCase(@PathVariable Long id, @Valid @RequestBody Case caseDetails) {
        try {
            Case updatedCase = caseService.updateCase(id, caseDetails);
            return ResponseEntity.ok(updatedCase);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCase(@PathVariable Long id) {
        caseService.deleteCase(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/lawyer/{lawyer}")
    public List<Case> getCasesByLawyer(@PathVariable String lawyer) {
        return caseService.getCasesByLawyer(lawyer);
    }

    @GetMapping("/alerts")
    public List<Case> getAlertCases() {
        return caseService.getAlertCases();
    }

    @GetMapping("/alerts/30days")
    public List<Case> getCasesExpiringIn30Days() {
        return caseService.getCasesExpiringIn30Days();
    }

    @GetMapping("/alerts/7days")
    public List<Case> getCasesExpiringIn7Days() {
        return caseService.getCasesExpiringIn7Days();
    }

    @GetMapping("/alerts/1day")
    public List<Case> getCasesExpiringIn1Day() {
        return caseService.getCasesExpiringIn1Day();
    }

    @PostMapping("/{caseId}/hearings")
    public ResponseEntity<?> addHearing(@PathVariable Long caseId, @Valid @RequestBody Hearing hearing) {
        try {
            Hearing createdHearing = caseService.addHearing(caseId, hearing);
            return ResponseEntity.ok(createdHearing);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/{caseId}/hearings")
    public List<Hearing> getHearingsByCaseId(@PathVariable Long caseId) {
        return caseService.getHearingsByCaseId(caseId);
    }

    @PostMapping("/{caseId}/judgments")
    public ResponseEntity<?> addJudgment(@PathVariable Long caseId, @Valid @RequestBody Judgment judgment) {
        try {
            Judgment createdJudgment = caseService.addJudgment(caseId, judgment);
            return ResponseEntity.ok(createdJudgment);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/{caseId}/judgments")
    public List<Judgment> getJudgmentsByCaseId(@PathVariable Long caseId) {
        return caseService.getJudgmentsByCaseId(caseId);
    }

    @GetMapping("/statistics")
    public Map<String, Object> getStatistics() {
        return caseService.getStatistics();
    }
}
