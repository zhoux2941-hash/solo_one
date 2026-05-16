package com.homework.controller;

import com.homework.entity.Submission;
import com.homework.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = "*")
public class SubmissionController {
    @Autowired
    private SubmissionService submissionService;

    @PostMapping("/submit")
    public ResponseEntity<?> submitHomework(
            @RequestParam Long homeworkId,
            @RequestParam Long studentId,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file) {
        try {
            Submission submission = submissionService.submitHomework(homeworkId, studentId, content, file);
            return ResponseEntity.ok(submission);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "文件上传失败"));
        }
    }

    @PostMapping("/grade/{id}")
    public ResponseEntity<?> gradeSubmission(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Integer score = Integer.valueOf(request.get("score").toString());
        String comment = (String) request.get("comment");
        Submission graded = submissionService.gradeSubmission(id, score, comment);
        return ResponseEntity.ok(graded);
    }

    @GetMapping("/homework/{homeworkId}")
    public ResponseEntity<?> getSubmissionsByHomework(@PathVariable Long homeworkId) {
        List<Submission> submissions = submissionService.getSubmissionsByHomework(homeworkId);
        return ResponseEntity.ok(submissions);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getSubmissionsByStudent(@PathVariable Long studentId) {
        List<Submission> submissions = submissionService.getSubmissionsByStudent(studentId);
        return ResponseEntity.ok(submissions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSubmissionById(@PathVariable Long id) {
        Optional<Submission> submission = submissionService.getSubmissionById(id);
        return submission.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/homework/{homeworkId}/student/{studentId}")
    public ResponseEntity<?> getSubmissionByHomeworkAndStudent(
            @PathVariable Long homeworkId,
            @PathVariable Long studentId) {
        Optional<Submission> submission = submissionService.getSubmissionByHomeworkAndStudent(homeworkId, studentId);
        return submission.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/homework/{homeworkId}/distribution")
    public ResponseEntity<?> getScoreDistribution(@PathVariable Long homeworkId) {
        return ResponseEntity.ok(submissionService.getScoreDistribution(homeworkId));
    }

    @GetMapping("/student/{studentId}/homework/{homeworkId}/percentile")
    public ResponseEntity<?> getStudentPercentile(
            @PathVariable Long studentId,
            @PathVariable Long homeworkId) {
        Double percentile = submissionService.getStudentPercentile(studentId, homeworkId);
        if (percentile != null) {
            return ResponseEntity.ok(Map.of("percentile", percentile));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/student/{studentId}/stats")
    public ResponseEntity<?> getStudentStats(
            @PathVariable Long studentId,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer size) {
        return ResponseEntity.ok(submissionService.getStudentStats(studentId, page, size));
    }
}
