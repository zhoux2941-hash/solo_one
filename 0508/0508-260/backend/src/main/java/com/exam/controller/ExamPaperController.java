package com.exam.controller;

import com.exam.common.Result;
import com.exam.entity.ExamPaper;
import com.exam.service.ExamPaperService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paper")
public class ExamPaperController {
    @Autowired
    private ExamPaperService examPaperService;

    @PostMapping("/create")
    public Result<ExamPaper> createExamPaper(@RequestBody ExamPaper examPaper) {
        return Result.success(examPaperService.createExamPaper(examPaper));
    }

    @PostMapping("/auto-generate")
    public Result<ExamPaper> autoGeneratePaper(@RequestBody Map<String, Object> params) {
        String name = (String) params.get("name");
        int singleCount = params.get("singleCount") != null ? (Integer) params.get("singleCount") : 0;
        int multipleCount = params.get("multipleCount") != null ? (Integer) params.get("multipleCount") : 0;
        int tfCount = params.get("tfCount") != null ? (Integer) params.get("tfCount") : 0;
        int shortAnswerCount = params.get("shortAnswerCount") != null ? (Integer) params.get("shortAnswerCount") : 0;
        int duration = params.get("duration") != null ? (Integer) params.get("duration") : 60;
        String category = (String) params.get("category");

        return Result.success(examPaperService.autoGeneratePaper(name, singleCount, multipleCount, tfCount, shortAnswerCount, duration, category));
    }

    @PutMapping("/update")
    public Result<ExamPaper> updateExamPaper(@RequestBody ExamPaper examPaper) {
        return Result.success(examPaperService.updateExamPaper(examPaper));
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteExamPaper(@PathVariable Long id) {
        examPaperService.deleteExamPaper(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<ExamPaper> getExamPaperById(@PathVariable Long id) {
        return Result.success(examPaperService.getExamPaperById(id));
    }

    @GetMapping("/list")
    public Result<List<ExamPaper>> getAllExamPapers() {
        return Result.success(examPaperService.getAllExamPapers());
    }
}
