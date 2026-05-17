package com.military.training.service;

import com.military.training.entity.ComprehensiveScore;
import com.military.training.entity.ScoreRecord;
import com.military.training.entity.Trainee;
import com.military.training.entity.TrainingSubject;
import com.military.training.repository.ComprehensiveScoreRepository;
import com.military.training.repository.ScoreRecordRepository;
import com.military.training.repository.TraineeRepository;
import com.military.training.repository.TrainingSubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ComprehensiveScoreService {

    @Autowired
    private ComprehensiveScoreRepository repository;

    @Autowired
    private ScoreRecordRepository scoreRecordRepository;

    @Autowired
    private TraineeRepository traineeRepository;

    @Autowired
    private TrainingSubjectRepository subjectRepository;

    private static final Map<String, Double> CATEGORY_WEIGHTS = new HashMap<>();
    static {
        CATEGORY_WEIGHTS.put("队列", 0.25);
        CATEGORY_WEIGHTS.put("战术", 0.30);
        CATEGORY_WEIGHTS.put("体能", 0.30);
        CATEGORY_WEIGHTS.put("射击", 0.15);
    }

    public List<ComprehensiveScore> findAllRanked() {
        return repository.findAllByOrderByRankAsc();
    }

    public Optional<ComprehensiveScore> findByTraineeId(Long traineeId) {
        return repository.findByTraineeId(traineeId);
    }

    @Transactional
    public Map<String, Object> calculateAllScores() {
        List<Trainee> trainees = traineeRepository.findAll();
        List<TrainingSubject> subjects = subjectRepository.findAll();

        Map<String, List<TrainingSubject>> subjectsByCategory = subjects.stream()
                .collect(Collectors.groupingBy(TrainingSubject::getCategory));

        Map<String, Double> categoryMaxScores = new HashMap<>();
        for (Map.Entry<String, List<TrainingSubject>> entry : subjectsByCategory.entrySet()) {
            double max = entry.getValue().stream().mapToDouble(TrainingSubject::getMaxScore).sum();
            categoryMaxScores.put(entry.getKey(), max);
        }

        List<Map<String, Object>> detailList = new ArrayList<>();
        List<ComprehensiveScore> scores = new ArrayList<>();

        for (Trainee trainee : trainees) {
            List<ScoreRecord> records = scoreRecordRepository.findByTraineeId(trainee.getId());
            Map<Long, Double> scoreMap = records.stream()
                    .collect(Collectors.toMap(ScoreRecord::getSubjectId, ScoreRecord::getScore));

            Map<String, Double> categoryScores = new HashMap<>();
            Map<String, Double> categoryPercentages = new HashMap<>();

            for (Map.Entry<String, List<TrainingSubject>> entry : subjectsByCategory.entrySet()) {
                String category = entry.getKey();
                double catScore = 0;
                for (TrainingSubject s : entry.getValue()) {
                    catScore += scoreMap.getOrDefault(s.getId(), 0.0);
                }
                categoryScores.put(category, catScore);
                double max = categoryMaxScores.getOrDefault(category, 100.0);
                categoryPercentages.put(category, max > 0 ? (catScore / max) * 100 : 0);
            }

            double weightedScore = 0;
            double totalWeight = 0;
            for (Map.Entry<String, Double> entry : CATEGORY_WEIGHTS.entrySet()) {
                String category = entry.getKey();
                Double weight = entry.getValue();
                if (categoryPercentages.containsKey(category)) {
                    weightedScore += categoryPercentages.get(category) * weight;
                    totalWeight += weight;
                }
            }
            if (totalWeight > 0) {
                weightedScore = weightedScore / totalWeight * 100;
            }

            double simpleTotal = records.stream().mapToDouble(ScoreRecord::getScore).sum();
            double avg = records.isEmpty() ? 0 : simpleTotal / records.size();

            int fullScoreCount = 0;
            int passCount = 0;
            for (ScoreRecord record : records) {
                TrainingSubject subject = subjects.stream()
                        .filter(s -> s.getId().equals(record.getSubjectId()))
                        .findFirst().orElse(null);
                if (subject != null) {
                    if (record.getScore() >= subject.getMaxScore()) {
                        fullScoreCount++;
                    }
                    if (record.getScore() >= subject.getPassScore()) {
                        passCount++;
                    }
                }
            }

            double passRate = records.isEmpty() ? 0 : (double) passCount / records.size() * 100;

            double finalScore = weightedScore;

            if (fullScoreCount >= 2) {
                finalScore += 3.0;
            } else if (fullScoreCount >= 1) {
                finalScore += 1.5;
            }

            if (passRate < 60) {
                finalScore -= 5.0;
            } else if (passRate < 80) {
                finalScore -= 2.0;
            }

            finalScore = Math.max(0, Math.min(100, finalScore));

            String level = calculateLevel(finalScore, passRate, categoryPercentages);

            ComprehensiveScore cs = new ComprehensiveScore();
            cs.setTraineeId(trainee.getId());
            cs.setTotalScore(finalScore);
            cs.setAverageScore(avg);
            cs.setCalculateTime(LocalDateTime.now());
            cs.setLevel(level);

            scores.add(cs);

            Map<String, Object> detail = new HashMap<>();
            detail.put("traineeId", trainee.getId());
            detail.put("traineeName", trainee.getName());
            detail.put("weightedScore", weightedScore);
            detail.put("finalScore", finalScore);
            detail.put("categoryScores", categoryPercentages);
            detail.put("fullScoreCount", fullScoreCount);
            detail.put("passRate", passRate);
            detail.put("level", level);
            detailList.add(detail);
        }

        scores.sort((a, b) -> Double.compare(b.getTotalScore(), a.getTotalScore()));
        for (int i = 0; i < scores.size(); i++) {
            scores.get(i).setRank(i + 1);
        }

        repository.deleteAll();
        repository.saveAll(scores);

        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", scores.size());
        result.put("levelStats", calculateLevelStats(scores));
        result.put("details", detailList);

        return result;
    }

    private String calculateLevel(double finalScore, double passRate, Map<String, Double> categoryPercentages) {
        boolean hasWeakCategory = categoryPercentages.values().stream().anyMatch(p -> p < 60);
        boolean hasExcellentCategory = categoryPercentages.values().stream().anyMatch(p -> p >= 95);

        if (finalScore >= 95 && passRate >= 95 && !hasWeakCategory) {
            return "特优";
        } else if (finalScore >= 90 && passRate >= 90 && !hasWeakCategory) {
            return "优秀";
        } else if (finalScore >= 80 && passRate >= 80) {
            return "良好";
        } else if (finalScore >= 70 && passRate >= 70) {
            return "中等";
        } else if (finalScore >= 60 && passRate >= 60) {
            return "及格";
        } else if (finalScore >= 50) {
            return "待提高";
        } else {
            return "不及格";
        }
    }

    private Map<String, Integer> calculateLevelStats(List<ComprehensiveScore> scores) {
        Map<String, Integer> stats = new LinkedHashMap<>();
        stats.put("特优", 0);
        stats.put("优秀", 0);
        stats.put("良好", 0);
        stats.put("中等", 0);
        stats.put("及格", 0);
        stats.put("待提高", 0);
        stats.put("不及格", 0);

        for (ComprehensiveScore score : scores) {
            stats.put(score.getLevel(), stats.getOrDefault(score.getLevel(), 0) + 1);
        }
        return stats;
    }

    public Map<String, Object> getWeaknessAnalysis(Long traineeId) {
        Map<String, Object> result = new HashMap<>();
        List<ScoreRecord> records = scoreRecordRepository.findByTraineeId(traineeId);
        List<TrainingSubject> subjects = subjectRepository.findAll();
        Map<Long, TrainingSubject> subjectMap = subjects.stream()
                .collect(Collectors.toMap(TrainingSubject::getId, s -> s));

        List<Map<String, Object>> weakSubjects = new ArrayList<>();
        for (ScoreRecord record : records) {
            TrainingSubject subject = subjectMap.get(record.getSubjectId());
            if (subject != null && record.getScore() < subject.getPassScore()) {
                Map<String, Object> item = new HashMap<>();
                item.put("subjectId", subject.getId());
                item.put("subjectName", subject.getName());
                item.put("category", subject.getCategory());
                item.put("score", record.getScore());
                item.put("passScore", subject.getPassScore());
                item.put("gap", subject.getPassScore() - record.getScore());

                double gap = subject.getPassScore() - record.getScore();
                double passScore = subject.getPassScore();
                if (gap > passScore * 0.4) {
                    item.put("severity", "严重");
                    item.put("suggestion", "急需专项训练，建议安排一对一辅导");
                } else if (gap > passScore * 0.2) {
                    item.put("severity", "较重");
                    item.put("suggestion", "需要重点加强，建议增加训练频次");
                } else {
                    item.put("severity", "轻微");
                    item.put("suggestion", "差距较小，保持日常训练即可");
                }

                weakSubjects.add(item);
            }
        }

        weakSubjects.sort((a, b) -> Double.compare((Double) b.get("gap"), (Double) a.get("gap")));
        result.put("traineeId", traineeId);
        result.put("weakSubjects", weakSubjects);
        result.put("weakCount", weakSubjects.size());

        int severeCount = 0;
        for (Map<String, Object> item : weakSubjects) {
            if ("严重".equals(item.get("severity"))) {
                severeCount++;
            }
        }
        result.put("severeWeakCount", severeCount);

        if (severeCount >= 2) {
            result.put("overallSuggestion", "整体情况较差，建议制定全面提升计划");
        } else if (severeCount >= 1) {
            result.put("overallSuggestion", "存在严重薄弱科目，建议重点突破");
        } else if (weakSubjects.size() >= 2) {
            result.put("overallSuggestion", "存在多个薄弱点，建议均衡发展");
        } else if (weakSubjects.size() > 0) {
            result.put("overallSuggestion", "整体良好，建议针对个别科目加强");
        } else {
            result.put("overallSuggestion", "表现优秀，继续保持");
        }

        return result;
    }
}
