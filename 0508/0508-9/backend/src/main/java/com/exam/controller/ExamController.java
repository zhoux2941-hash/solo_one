package com.exam.controller;

import com.exam.dto.ApiResponse;
import com.exam.entity.Exam;
import com.exam.entity.Question;
import com.exam.repository.ExamRepository;
import com.exam.repository.QuestionRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exam")
@CrossOrigin(origins = "*")
public class ExamController {
    
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    
    public ExamController(ExamRepository examRepository, QuestionRepository questionRepository) {
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
    }
    
    @GetMapping("/list")
    public ApiResponse<List<Exam>> listExams(@RequestParam(required = false) Long createdBy) {
        List<Exam> exams;
        if (createdBy != null) {
            exams = examRepository.findByCreatedBy(createdBy);
        } else {
            exams = examRepository.findAll();
        }
        return ApiResponse.success(exams);
    }
    
    @PostMapping("/create")
    public ApiResponse<Exam> createExam(@RequestBody Exam exam) {
        Exam saved = examRepository.save(exam);
        return ApiResponse.success(saved);
    }
    
    @GetMapping("/{examId}")
    public ApiResponse<Exam> getExam(@PathVariable Long examId) {
        return examRepository.findById(examId)
                .map(ApiResponse::success)
                .orElse(ApiResponse.error(404, "Exam not found"));
    }
    
    @PutMapping("/{examId}")
    public ApiResponse<Exam> updateExam(@PathVariable Long examId, @RequestBody Exam exam) {
        exam.setId(examId);
        Exam saved = examRepository.save(exam);
        return ApiResponse.success(saved);
    }
    
    @GetMapping("/{examId}/questions")
    public ApiResponse<List<Question>> getQuestions(@PathVariable Long examId) {
        List<Question> questions = questionRepository.findByExamIdOrderByQuestionOrder(examId);
        return ApiResponse.success(questions);
    }
    
    @PostMapping("/{examId}/questions")
    public ApiResponse<Question> addQuestion(@PathVariable Long examId, @RequestBody Question question) {
        question.setExamId(examId);
        if (question.getQuestionOrder() == null) {
            List<Question> existing = questionRepository.findByExamId(examId);
            question.setQuestionOrder(existing.size() + 1);
        }
        Question saved = questionRepository.save(question);
        return ApiResponse.success(saved);
    }
    
    @PostMapping("/{examId}/questions/batch")
    public ApiResponse<List<Question>> addQuestionsBatch(@PathVariable Long examId, 
                                                          @RequestBody List<Question> questions) {
        int order = questionRepository.findByExamId(examId).size() + 1;
        for (Question q : questions) {
            q.setExamId(examId);
            if (q.getQuestionOrder() == null) {
                q.setQuestionOrder(order++);
            }
        }
        List<Question> saved = questionRepository.saveAll(questions);
        return ApiResponse.success(saved);
    }
    
    @PutMapping("/{examId}/status")
    public ApiResponse<Exam> updateStatus(@PathVariable Long examId, @RequestBody Map<String, String> body) {
        return examRepository.findById(examId).map(exam -> {
            exam.setStatus(body.get("status"));
            return ApiResponse.success(examRepository.save(exam));
        }).orElse(ApiResponse.error(404, "Exam not found"));
    }
}
