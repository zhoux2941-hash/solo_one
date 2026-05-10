package com.quiz.controller;

import com.quiz.entity.Question;
import com.quiz.entity.QuestionCategory;
import com.quiz.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping("/categories")
    public ResponseEntity<QuestionCategory> createCategory(
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        return ResponseEntity.ok(questionService.createCategory(name, description));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<QuestionCategory>> getAllCategories() {
        return ResponseEntity.ok(questionService.getAllCategories());
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<QuestionCategory> getCategory(@PathVariable Long id) {
        QuestionCategory category = questionService.getCategoryById(id);
        if (category == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(category);
    }

    @PostMapping
    public ResponseEntity<Question> addQuestion(@RequestBody Question question) {
        return ResponseEntity.ok(questionService.addQuestion(question));
    }

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {
        return ResponseEntity.ok(questionService.getAllQuestions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestion(@PathVariable Long id) {
        Question question = questionService.getQuestionById(id);
        if (question == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(question);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Question>> getQuestionsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(questionService.getQuestionsByCategory(categoryId));
    }

    @PostMapping("/import")
    public ResponseEntity<?> importQuestions(
            @RequestParam("file") MultipartFile file,
            @RequestParam("categoryId") Long categoryId) {
        try {
            Map<String, Object> result = questionService.importQuestionsFromExcel(file, categoryId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Import failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
