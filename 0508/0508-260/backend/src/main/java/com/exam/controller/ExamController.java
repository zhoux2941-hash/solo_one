package com.exam.controller;

import com.exam.common.Result;
import com.exam.entity.*;
import com.exam.service.ExamService;
import com.exam.service.ExamPaperService;
import com.exam.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/exam")
public class ExamController {
    @Autowired
    private ExamService examService;

    @Autowired
    private ExamPaperService examPaperService;

    @Autowired
    private QuestionService questionService;

    @PostMapping("/session/create")
    public Result<ExamSession> createExamSession(@RequestBody ExamSession session) {
        return Result.success(examService.createExamSession(session));
    }

    @PutMapping("/session/update")
    public Result<ExamSession> updateExamSession(@RequestBody ExamSession session) {
        return Result.success(examService.updateExamSession(session));
    }

    @DeleteMapping("/session/{id}")
    public Result<Void> deleteExamSession(@PathVariable Long id) {
        examService.deleteExamSession(id);
        return Result.success();
    }

    @GetMapping("/session/{id}")
    public Result<ExamSession> getExamSessionById(@PathVariable Long id) {
        return Result.success(examService.getExamSessionById(id));
    }

    @GetMapping("/session/list")
    public Result<List<ExamSession>> getAllExamSessions() {
        return Result.success(examService.getAllExamSessions());
    }

    @PostMapping("/start")
    public Result<ExamRecord> startExam(@RequestBody Map<String, Long> params) {
        Long userId = params.get("userId");
        Long examSessionId = params.get("examSessionId");
        return Result.success(examService.startExam(userId, examSessionId));
    }

    @PostMapping("/answer/save")
    public Result<Answer> saveAnswer(@RequestBody Map<String, Object> params) {
        Long examRecordId = Long.valueOf(params.get("examRecordId").toString());
        Long questionId = Long.valueOf(params.get("questionId").toString());
        String answer = (String) params.get("answer");
        return Result.success(examService.saveAnswer(examRecordId, questionId, answer));
    }

    @GetMapping("/answers/{recordId}")
    public Result<List<Answer>> getAnswersByRecordId(@PathVariable Long recordId) {
        return Result.success(examService.getAnswersByRecordId(recordId));
    }

    @PostMapping("/submit")
    public Result<ExamRecord> submitExam(@RequestBody Map<String, Long> params) {
        Long examRecordId = params.get("examRecordId");
        return Result.success(examService.submitExam(examRecordId));
    }

    @GetMapping("/record/user/{userId}")
    public Result<List<ExamRecord>> getExamRecordsByUserId(@PathVariable Long userId) {
        return Result.success(examService.getExamRecordsByUserId(userId));
    }

    @GetMapping("/record/session/{sessionId}")
    public Result<List<ExamRecord>> getExamRecordsBySessionId(@PathVariable Long sessionId) {
        return Result.success(examService.getExamRecordsBySessionId(sessionId));
    }

    @GetMapping("/ranking/{sessionId}")
    public Result<List<ExamRecord>> getRankingBySessionId(@PathVariable Long sessionId) {
        return Result.success(examService.getRankingBySessionId(sessionId));
    }

    @GetMapping("/record/{id}")
    public Result<ExamRecord> getExamRecordById(@PathVariable Long id) {
        return Result.success(examService.getExamRecordById(id));
    }

    @GetMapping("/paper/questions/{paperId}")
    public Result<List<Question>> getPaperQuestions(@PathVariable Long paperId) {
        ExamPaper paper = examPaperService.getExamPaperById(paperId);
        List<Question> questions = new ArrayList<>();
        if (paper != null && paper.getQuestionIds() != null) {
            for (Long qid : paper.getQuestionIds()) {
                Question q = questionService.getQuestionById(qid);
                if (q != null) {
                    q.setAnswer(null);
                    questions.add(q);
                }
            }
        }
        return Result.success(questions);
    }
}
