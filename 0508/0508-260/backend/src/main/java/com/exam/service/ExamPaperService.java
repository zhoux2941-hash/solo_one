package com.exam.service;

import com.exam.entity.ExamPaper;
import com.exam.entity.Question;
import com.exam.repository.ExamPaperRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExamPaperService {
    @Autowired
    private ExamPaperRepository examPaperRepository;

    @Autowired
    private QuestionService questionService;

    public ExamPaper createExamPaper(ExamPaper examPaper) {
        int totalScore = 0;
        if (examPaper.getQuestionIds() != null) {
            for (Long questionId : examPaper.getQuestionIds()) {
                Question question = questionService.getQuestionById(questionId);
                if (question != null && question.getScore() != null) {
                    totalScore += question.getScore();
                }
            }
        }
        examPaper.setTotalScore(totalScore);
        return examPaperRepository.save(examPaper);
    }

    public ExamPaper autoGeneratePaper(String name, int singleCount, int multipleCount,
                                       int tfCount, int shortAnswerCount, int duration, String category) {
        ExamPaper paper = new ExamPaper();
        paper.setName(name);
        paper.setDuration(duration);

        List<Question> singleQuestions = questionService.generateRandomQuestions(
                singleCount, category).stream()
                .filter(q -> q.getType() == Question.QuestionType.SINGLE_CHOICE)
                .collect(Collectors.toList());

        List<Question> multipleQuestions = questionService.generateRandomQuestions(
                multipleCount, category).stream()
                .filter(q -> q.getType() == Question.QuestionType.MULTIPLE_CHOICE)
                .collect(Collectors.toList());

        List<Question> tfQuestions = questionService.generateRandomQuestions(
                tfCount, category).stream()
                .filter(q -> q.getType() == Question.QuestionType.TRUE_FALSE)
                .collect(Collectors.toList());

        List<Question> shortAnswerQuestions = questionService.generateRandomQuestions(
                shortAnswerCount, category).stream()
                .filter(q -> q.getType() == Question.QuestionType.SHORT_ANSWER)
                .collect(Collectors.toList());

        List<Long> questionIds = new java.util.ArrayList<>();
        singleQuestions.forEach(q -> questionIds.add(q.getId()));
        multipleQuestions.forEach(q -> questionIds.add(q.getId()));
        tfQuestions.forEach(q -> questionIds.add(q.getId()));
        shortAnswerQuestions.forEach(q -> questionIds.add(q.getId()));

        paper.setQuestionIds(questionIds);
        return createExamPaper(paper);
    }

    public ExamPaper updateExamPaper(ExamPaper examPaper) {
        return examPaperRepository.save(examPaper);
    }

    public void deleteExamPaper(Long id) {
        examPaperRepository.deleteById(id);
    }

    public ExamPaper getExamPaperById(Long id) {
        return examPaperRepository.findById(id).orElse(null);
    }

    public List<ExamPaper> getAllExamPapers() {
        return examPaperRepository.findAll();
    }
}
