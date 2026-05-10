package com.quiz.service;

import com.quiz.entity.Difficulty;
import com.quiz.entity.Question;
import com.quiz.entity.QuestionCategory;
import com.quiz.repository.QuestionCategoryRepository;
import com.quiz.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionCategoryRepository categoryRepository;

    @Transactional
    public QuestionCategory createCategory(String name, String description) {
        QuestionCategory category = new QuestionCategory();
        category.setName(name);
        category.setDescription(description);
        return categoryRepository.save(category);
    }

    public List<QuestionCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    public QuestionCategory getCategoryById(Long id) {
        return categoryRepository.findById(id).orElse(null);
    }

    @Transactional
    public Question addQuestion(Question question) {
        return questionRepository.save(question);
    }

    public List<Question> getQuestionsByCategory(Long categoryId) {
        return questionRepository.findByCategoryId(categoryId);
    }

    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    public Question getQuestionById(Long id) {
        return questionRepository.findById(id).orElse(null);
    }

    @Transactional
    public Map<String, Object> importQuestionsFromExcel(MultipartFile file, Long categoryId) throws IOException {
        Map<String, Object> result = new HashMap<>();
        List<Question> importedQuestions = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;

        QuestionCategory category = categoryRepository.findById(categoryId).orElse(null);
        if (category == null) {
            throw new RuntimeException("Category not found");
        }

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    Question question = parseQuestionFromRow(row, categoryId);
                    if (question != null) {
                        importedQuestions.add(question);
                        successCount++;
                    } else {
                        failCount++;
                        errors.add("Row " + (i + 1) + ": Invalid question format");
                    }
                } catch (Exception e) {
                    failCount++;
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }

            questionRepository.saveAll(importedQuestions);
        }

        result.put("success", true);
        result.put("successCount", successCount);
        result.put("failCount", failCount);
        result.put("errors", errors);
        result.put("totalImported", importedQuestions.size());

        log.info("Imported {} questions from Excel", successCount);
        return result;
    }

    private Question parseQuestionFromRow(Row row, Long categoryId) {
        String content = getCellValueAsString(row.getCell(0));
        String optionA = getCellValueAsString(row.getCell(1));
        String optionB = getCellValueAsString(row.getCell(2));
        String optionC = getCellValueAsString(row.getCell(3));
        String optionD = getCellValueAsString(row.getCell(4));
        String correctAnswer = getCellValueAsString(row.getCell(5));
        String difficultyStr = getCellValueAsString(row.getCell(6));
        String pointsStr = getCellValueAsString(row.getCell(7));

        if (content == null || content.trim().isEmpty()) {
            return null;
        }
        if (correctAnswer == null || !correctAnswer.matches("[A-Da-d]")) {
            throw new RuntimeException("Correct answer must be A, B, C, or D");
        }

        Question question = new Question();
        question.setCategoryId(categoryId);
        question.setContent(content);
        question.setOptionA(optionA);
        question.setOptionB(optionB);
        question.setOptionC(optionC);
        question.setOptionD(optionD);
        question.setCorrectAnswer(correctAnswer.toUpperCase());

        if (difficultyStr != null && !difficultyStr.isEmpty()) {
            try {
                question.setDifficulty(Difficulty.valueOf(difficultyStr.toUpperCase()));
            } catch (IllegalArgumentException e) {
                question.setDifficulty(Difficulty.MEDIUM);
            }
        } else {
            question.setDifficulty(Difficulty.MEDIUM);
        }

        if (pointsStr != null && !pointsStr.isEmpty()) {
            try {
                question.setPoints(Integer.parseInt(pointsStr));
            } catch (NumberFormatException e) {
                question.setPoints(10);
            }
        } else {
            question.setPoints(10);
        }

        return question;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }
}
