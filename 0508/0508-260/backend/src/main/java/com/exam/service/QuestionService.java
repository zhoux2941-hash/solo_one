package com.exam.service;

import com.exam.dto.BatchImportResult;
import com.exam.entity.Question;
import com.exam.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class QuestionService {
    @Autowired
    private QuestionRepository questionRepository;

    public Question createQuestion(Question question) {
        return questionRepository.save(question);
    }

    public BatchImportResult createQuestionsWithDeduplication(List<Question> questions) {
        int totalCount = questions.size();

        List<Question> existingQuestions = questionRepository.findAll();
        List<String> existingContents = existingQuestions.stream()
                .map(Question::getContent)
                .collect(Collectors.toList());

        List<String> duplicatesInBatch = new ArrayList<>();
        List<Question> uniqueInBatch = new ArrayList<>();
        for (Question q : questions) {
            String content = q.getContent();
            if (uniqueInBatch.stream().noneMatch(uq -> uq.getContent().equals(content))) {
                uniqueInBatch.add(q);
            } else {
                duplicatesInBatch.add(content);
            }
        }

        List<String> duplicatesInDb = new ArrayList<>();
        List<Question> uniqueQuestions = new ArrayList<>();
        for (Question q : uniqueInBatch) {
            if (!existingContents.contains(q.getContent())) {
                uniqueQuestions.add(q);
            } else {
                duplicatesInDb.add(q.getContent());
            }
        }

        List<String> allDuplicates = new ArrayList<>();
        allDuplicates.addAll(duplicatesInBatch);
        allDuplicates.addAll(duplicatesInDb);

        List<Question> savedQuestions = questionRepository.saveAll(uniqueQuestions);

        return new BatchImportResult(
                totalCount,
                savedQuestions.size(),
                allDuplicates.size(),
                allDuplicates
        );
    }

    public Question updateQuestion(Question question) {
        return questionRepository.save(question);
    }

    public void deleteQuestion(Long id) {
        questionRepository.deleteById(id);
    }

    public Question getQuestionById(Long id) {
        return questionRepository.findById(id).orElse(null);
    }

    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    public List<Question> getQuestionsByCategory(String category) {
        return questionRepository.findByCategory(category);
    }

    public List<Question> generateRandomQuestions(int count, String category) {
        List<Question> questions = category != null ?
                questionRepository.findByCategory(category) :
                questionRepository.findAll();

        if (questions.size() <= count) {
            return questions;
        }

        List<Question> shuffled = new ArrayList<>(questions);
        Collections.shuffle(shuffled, new Random());
        return shuffled.subList(0, count);
    }
}
