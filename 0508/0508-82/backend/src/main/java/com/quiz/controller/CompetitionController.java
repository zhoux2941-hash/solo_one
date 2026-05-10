package com.quiz.controller;

import com.quiz.dto.CreateCompetitionRequest;
import com.quiz.dto.JudgeAnswerRequest;
import com.quiz.dto.SubmitAnswerRequest;
import com.quiz.entity.Competition;
import com.quiz.entity.Question;
import com.quiz.entity.Team;
import com.quiz.service.CompetitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/competitions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompetitionController {

    private final CompetitionService competitionService;

    @PostMapping
    public ResponseEntity<Competition> createCompetition(@Valid @RequestBody CreateCompetitionRequest request) {
        return ResponseEntity.ok(competitionService.createCompetition(request));
    }

    @GetMapping
    public ResponseEntity<List<Competition>> getAllCompetitions() {
        return ResponseEntity.ok(competitionService.getAllCompetitions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Competition> getCompetition(@PathVariable Long id) {
        Competition competition = competitionService.getCompetitionById(id);
        if (competition == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(competition);
    }

    @GetMapping("/{id}/teams")
    public ResponseEntity<List<Team>> getTeams(@PathVariable Long id) {
        return ResponseEntity.ok(competitionService.getTeamsWithScores(id));
    }

    @GetMapping("/{id}/current-question")
    public ResponseEntity<Question> getCurrentQuestion(@PathVariable Long id) {
        Question question = competitionService.getCurrentQuestion(id);
        if (question == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(question);
    }

    @GetMapping("/{id}/buzzer-status")
    public ResponseEntity<Map<String, Object>> getBuzzerStatus(@PathVariable Long id) {
        return ResponseEntity.ok(competitionService.getBuzzerStatus(id));
    }

    @PostMapping("/{id}/buzz")
    public ResponseEntity<Map<String, Object>> buzz(
            @PathVariable Long id,
            @RequestParam Long teamId) {
        return ResponseEntity.ok(competitionService.buzz(id, teamId));
    }

    @PostMapping("/submit-answer")
    public ResponseEntity<Map<String, Object>> submitAnswer(@RequestBody SubmitAnswerRequest request) {
        return ResponseEntity.ok(competitionService.submitAnswer(request));
    }

    @GetMapping("/{id}/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(@PathVariable Long id) {
        return ResponseEntity.ok(competitionService.getCompetitionStatistics(id));
    }
}
