package com.club.recruitment.controller;

import com.club.recruitment.dto.ApplicantRequest;
import com.club.recruitment.dto.AdjustInterviewRequest;
import com.club.recruitment.dto.InterviewListResponse;
import com.club.recruitment.entity.Applicant;
import com.club.recruitment.service.ApplicantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applicants")
@RequiredArgsConstructor
public class ApplicantController {

    private final ApplicantService applicantService;

    @PostMapping
    public ResponseEntity<?> registerApplicant(@Valid @RequestBody ApplicantRequest request) {
        try {
            Applicant applicant = applicantService.registerApplicant(request);
            return ResponseEntity.ok(applicant);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Applicant>> getAllApplicants() {
        return ResponseEntity.ok(applicantService.getAllApplicants());
    }

    @GetMapping("/unassigned")
    public ResponseEntity<List<Applicant>> getUnassignedApplicants() {
        return ResponseEntity.ok(applicantService.getUnassignedApplicants());
    }

    @PostMapping("/allocate")
    public ResponseEntity<Map<String, Object>> runAllocation() {
        return ResponseEntity.ok(applicantService.runAllocation());
    }

    @DeleteMapping("/allocations")
    public ResponseEntity<Map<String, String>> resetAllAllocations() {
        applicantService.resetAllAllocations();
        return ResponseEntity.ok(Map.of("message", "已重置所有分配"));
    }

    @GetMapping("/interview-list/{departmentId}")
    public ResponseEntity<List<InterviewListResponse>> getInterviewList(@PathVariable Long departmentId) {
        return ResponseEntity.ok(applicantService.getInterviewListByDepartment(departmentId));
    }

    @PostMapping("/check-conflict")
    public ResponseEntity<Map<String, Object>> checkConflict(
            @RequestParam Long applicantId,
            @RequestParam Long targetDepartmentId,
            @RequestParam String targetSlot) {
        return ResponseEntity.ok(applicantService.checkInterviewConflict(applicantId, targetDepartmentId, targetSlot));
    }

    @PostMapping("/adjust-interview")
    public ResponseEntity<?> adjustInterview(@RequestBody AdjustInterviewRequest request) {
        try {
            return ResponseEntity.ok(applicantService.adjustInterviewTime(
                    request.getApplicantId(),
                    request.getTargetDepartmentId(),
                    request.getTargetSlot()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}