package com.exam.service;

import com.exam.entity.*;
import com.exam.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExamService {
    @Autowired
    private ExamSessionRepository examSessionRepository;

    @Autowired
    private ExamRecordRepository examRecordRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private QuestionService questionService;

    @Autowired
    private ExamPaperService examPaperService;

    public ExamSession createExamSession(ExamSession session) {
        return examSessionRepository.save(session);
    }

    public ExamSession updateExamSession(ExamSession session) {
        return examSessionRepository.save(session);
    }

    public void deleteExamSession(Long id) {
        examSessionRepository.deleteById(id);
    }

    public ExamSession getExamSessionById(Long id) {
        return examSessionRepository.findById(id).orElse(null);
    }

    public List<ExamSession> getAllExamSessions() {
        return examSessionRepository.findAll();
    }

    public ExamRecord startExam(Long userId, Long examSessionId) {
        ExamSession session = getExamSessionById(examSessionId);
        if (session == null) {
            throw new RuntimeException("考试不存在");
        }

        Optional<ExamRecord> existing = examRecordRepository.findByUserIdAndExamSessionId(userId, examSessionId);
        if (existing.isPresent()) {
            return existing.get();
        }

        ExamRecord record = new ExamRecord();
        record.setUserId(userId);
        record.setExamSessionId(examSessionId);
        record.setExamPaperId(session.getExamPaperId());
        record.setStatus(ExamRecord.RecordStatus.IN_PROGRESS);
        record.setStartTime(LocalDateTime.now());
        return examRecordRepository.save(record);
    }

    public Answer saveAnswer(Long examRecordId, Long questionId, String answer) {
        Optional<Answer> existingOpt = answerRepository.findByExamRecordIdAndQuestionId(examRecordId, questionId);
        Answer answerObj;

        if (existingOpt.isPresent()) {
            answerObj = existingOpt.get();
            answerObj.setAnswer(answer);
            answerObj.setSaveTime(LocalDateTime.now());
        } else {
            answerObj = new Answer();
            answerObj.setExamRecordId(examRecordId);
            answerObj.setQuestionId(questionId);
            answerObj.setAnswer(answer);
        }

        return answerRepository.save(answerObj);
    }

    public List<Answer> getAnswersByRecordId(Long examRecordId) {
        return answerRepository.findByExamRecordId(examRecordId);
    }

    public ExamRecord submitExam(Long examRecordId) {
        ExamRecord record = examRecordRepository.findById(examRecordId)
                .orElseThrow(() -> new RuntimeException("考试记录不存在"));

        record.setEndTime(LocalDateTime.now());
        record.setStatus(ExamRecord.RecordStatus.SUBMITTED);

        gradeExam(record);

        return examRecordRepository.save(record);
    }

    private void gradeExam(ExamRecord record) {
        List<Answer> answers = answerRepository.findByExamRecordId(record.getId());
        ExamPaper paper = examPaperService.getExamPaperById(record.getExamPaperId());

        int totalScore = 0;
        int userScore = 0;

        for (Long questionId : paper.getQuestionIds()) {
            Question question = questionService.getQuestionById(questionId);
            if (question == null) continue;

            totalScore += question.getScore() != null ? question.getScore() : 0;

            Optional<Answer> answerOpt = answers.stream()
                    .filter(a -> a.getQuestionId().equals(questionId))
                    .findFirst();

            if (answerOpt.isPresent()) {
                Answer answer = answerOpt.get();
                boolean isCorrect = question.getAnswer().equalsIgnoreCase(answer.getAnswer());
                answer.setIsCorrect(isCorrect);

                if (isCorrect) {
                    answer.setScore(question.getScore());
                    userScore += question.getScore() != null ? question.getScore() : 0;
                } else {
                    answer.setScore(0);
                }
                answerRepository.save(answer);
            }
        }

        record.setScore(userScore);
        record.setTotalScore(totalScore);
        record.setPassed(userScore >= (paper.getPassScore() != null ? paper.getPassScore() : totalScore * 0.6));
        record.setStatus(ExamRecord.RecordStatus.GRADED);
    }

    public List<ExamRecord> getExamRecordsByUserId(Long userId) {
        return examRecordRepository.findByUserId(userId);
    }

    public List<ExamRecord> getExamRecordsBySessionId(Long sessionId) {
        return examRecordRepository.findByExamSessionId(sessionId);
    }

    public List<ExamRecord> getRankingBySessionId(Long sessionId) {
        List<ExamRecord> records = examRecordRepository.findByExamSessionId(sessionId);
        return records.stream()
                .filter(r -> r.getStatus() == ExamRecord.RecordStatus.GRADED)
                .sorted((a, b) -> b.getScore().compareTo(a.getScore()))
                .collect(Collectors.toList());
    }

    public ExamRecord getExamRecordById(Long id) {
        return examRecordRepository.findById(id).orElse(null);
    }
}
