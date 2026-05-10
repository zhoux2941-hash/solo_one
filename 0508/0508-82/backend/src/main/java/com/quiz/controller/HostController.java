package com.quiz.controller;

import com.quiz.dto.JudgeAnswerRequest;
import com.quiz.entity.Question;
import com.quiz.service.CompetitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/host")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HostController {

    private final CompetitionService competitionService;

    @PostMapping("/competitions/{id}/start")
    public ResponseEntity<?> startCompetition(@PathVariable Long id) {
        try {
            competitionService.startCompetition(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Competition started successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/competitions/{id}/next-question")
    public ResponseEntity<?> nextQuestion(@PathVariable Long id) {
        try {
            Question question = competitionService.nextQuestion(id);
            Map<String, Object> response = new HashMap<>();
            if (question == null) {
                response.put("success", true);
                response.put("finished", true);
                response.put("message", "Competition finished");
            } else {
                response.put("success", true);
                response.put("finished", false);
                response.put("question", question);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/competitions/judge")
    public ResponseEntity<?> judgeAnswer(@RequestBody JudgeAnswerRequest request) {
        try {
            Map<String, Object> result = competitionService.judgeAnswer(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/competitions/{id}/reset-buzzer")
    public ResponseEntity<?> resetBuzzer(@PathVariable Long id) {
        try {
            Map<String, Object> result = competitionService.resetBuzzer(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/competitions/{id}/finish")
    public ResponseEntity<?> finishCompetition(@PathVariable Long id) {
        try {
            competitionService.finishCompetition(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Competition finished successfully");
            response.put("statistics", competitionService.getCompetitionStatistics(id));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
