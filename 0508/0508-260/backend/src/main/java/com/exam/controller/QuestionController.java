package com.exam.controller;

import com.exam.common.Result;
import com.exam.dto.BatchImportResult;
import com.exam.entity.Question;
import com.exam.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/question")
public class QuestionController {
    @Autowired
    private QuestionService questionService;

    @PostMapping("/create")
    public Result<Question> createQuestion(@RequestBody Question question) {
        return Result.success(questionService.createQuestion(question));
    }

    @PostMapping("/batch")
    public Result<BatchImportResult> batchCreateQuestions(@RequestBody List<Question> questions) {
        return Result.success(questionService.createQuestionsWithDeduplication(questions));
    }

    @PutMapping("/update")
    public Result<Question> updateQuestion(@RequestBody Question question) {
        return Result.success(questionService.updateQuestion(question));
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<Question> getQuestionById(@PathVariable Long id) {
        return Result.success(questionService.getQuestionById(id));
    }

    @GetMapping("/list")
    public Result<List<Question>> getAllQuestions() {
        return Result.success(questionService.getAllQuestions());
    }

    @GetMapping("/category/{category}")
    public Result<List<Question>> getQuestionsByCategory(@PathVariable String category) {
        return Result.success(questionService.getQuestionsByCategory(category));
    }
}
