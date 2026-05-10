package com.quiz.service;

import com.quiz.dto.CreateCompetitionRequest;
import com.quiz.dto.JudgeAnswerRequest;
import com.quiz.dto.SubmitAnswerRequest;
import com.quiz.dto.WebSocketMessage;
import com.quiz.entity.*;
import com.quiz.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final TeamRepository teamRepository;
    private final QuestionRepository questionRepository;
    private final CompetitionQuestionRepository competitionQuestionRepository;
    private final AnswerRecordRepository answerRecordRepository;
    private final RedisLockService redisLockService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String BUZZER_LOCK_PREFIX = "quiz:buzzer:";
    private static final String CURRENT_QUESTION_PREFIX = "quiz:current_question:";
    private static final String ANSWER_TIME_LIMIT = "quiz:answer_timer:";

    @Transactional
    public Competition createCompetition(CreateCompetitionRequest request) {
        if (request.getTeamNames().size() != request.getTeamCount()) {
            throw new RuntimeException("Team names count must match team count");
        }

        Competition competition = new Competition();
        competition.setName(request.getName());
        competition.setDescription(request.getDescription());
        competition.setCategoryIds(request.getCategoryIds().stream().map(String::valueOf).collect(Collectors.joining(",")));
        competition.setQuestionCount(request.getQuestionCount());
        competition.setTeamCount(request.getTeamCount());
        competition.setStatus(CompetitionStatus.CREATED);
        competition.setCurrentQuestionIndex(0);
        competition = competitionRepository.save(competition);

        for (int i = 0; i < request.getTeamCount(); i++) {
            Team team = new Team();
            team.setCompetitionId(competition.getId());
            team.setName(request.getTeamNames().get(i));
            teamRepository.save(team);
        }

        log.info("Competition created: {}", competition.getId());
        return competition;
    }

    @Transactional
    public void startCompetition(Long competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        if (competition.getStatus() != CompetitionStatus.CREATED) {
            throw new RuntimeException("Competition already started or finished");
        }

        List<Long> categoryIds = Arrays.stream(competition.getCategoryIds().split(","))
                .map(Long::parseLong)
                .collect(Collectors.toList());

        List<Question> availableQuestions = questionRepository.findByCategoryIds(categoryIds);
        if (availableQuestions.size() < competition.getQuestionCount()) {
            throw new RuntimeException("Not enough questions available. Available: " + availableQuestions.size());
        }

        Collections.shuffle(availableQuestions);
        List<Question> selectedQuestions = availableQuestions.subList(0, competition.getQuestionCount());

        for (int i = 0; i < selectedQuestions.size(); i++) {
            CompetitionQuestion cq = new CompetitionQuestion();
            cq.setCompetitionId(competitionId);
            cq.setQuestionId(selectedQuestions.get(i).getId());
            cq.setQuestionOrder(i);
            competitionQuestionRepository.save(cq);
        }

        competition.setStatus(CompetitionStatus.IN_PROGRESS);
        competitionRepository.save(competition);

        broadcastMessage(competitionId, "COMPETITION_STARTED", "Competition has started!");
        log.info("Competition started: {}", competitionId);
    }

    public Question getCurrentQuestion(Long competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        if (competition.getStatus() != CompetitionStatus.IN_PROGRESS) {
            return null;
        }

        CompetitionQuestion cq = competitionQuestionRepository.findByCompetitionIdAndQuestionOrder(
                competitionId, competition.getCurrentQuestionIndex());

        if (cq == null) {
            return null;
        }

        return questionRepository.findById(cq.getQuestionId()).orElse(null);
    }

    @Transactional
    public Question nextQuestion(Long competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        if (competition.getStatus() != CompetitionStatus.IN_PROGRESS) {
            throw new RuntimeException("Competition not in progress");
        }

        clearBuzzerLock(competitionId);
        clearAnswerTimer(competitionId);

        int nextIndex = competition.getCurrentQuestionIndex() + 1;
        if (nextIndex >= competition.getQuestionCount()) {
            finishCompetition(competitionId);
            return null;
        }

        competition.setCurrentQuestionIndex(nextIndex);
        competitionRepository.save(competition);

        Question question = getCurrentQuestion(competitionId);

        Map<String, Object> questionData = new HashMap<>();
        questionData.put("index", nextIndex + 1);
        questionData.put("total", competition.getQuestionCount());
        questionData.put("question", question);
        broadcastMessage(competitionId, "QUESTION_DISPLAYED", questionData);

        redisLockService.releaseLock(CURRENT_QUESTION_PREFIX + competitionId, "host");
        redisTemplate.opsForValue().set(CURRENT_QUESTION_PREFIX + competitionId, question.getId(), 5, TimeUnit.MINUTES);

        log.info("Next question displayed for competition: {}", competitionId);
        return question;
    }

    public Map<String, Object> getBuzzerStatus(Long competitionId) {
        Map<String, Object> status = new HashMap<>();
        Object lockValue = redisLockService.getLockValue(BUZZER_LOCK_PREFIX + competitionId);

        if (lockValue != null) {
            Long teamId = Long.parseLong(lockValue.toString());
            Team team = teamRepository.findById(teamId).orElse(null);
            status.put("available", false);
            status.put("winnerTeamId", teamId);
            status.put("winnerTeamName", team != null ? team.getName() : "Unknown");
        } else {
            status.put("available", true);
            status.put("winnerTeamId", null);
            status.put("winnerTeamName", null);
        }

        return status;
    }

    public Map<String, Object> buzz(Long competitionId, Long teamId) {
        Map<String, Object> result = new HashMap<>();

        String lockKey = BUZZER_LOCK_PREFIX + competitionId;
        boolean acquired = redisLockService.tryLock(lockKey, String.valueOf(teamId), 15, TimeUnit.SECONDS);

        if (acquired) {
            Team team = teamRepository.findById(teamId).orElse(null);
            result.put("success", true);
            result.put("teamId", teamId);
            result.put("teamName", team != null ? team.getName() : "Unknown");

            startAnswerTimer(competitionId);

            Map<String, Object> broadcastData = new HashMap<>();
            broadcastData.put("teamId", teamId);
            broadcastData.put("teamName", team != null ? team.getName() : "Unknown");
            broadcastMessage(competitionId, "BUZZER_WON", broadcastData);

            log.info("Team {} won the buzzer for competition {}", teamId, competitionId);
        } else {
            Object winner = redisLockService.getLockValue(lockKey);
            result.put("success", false);
            result.put("message", "Too late! Buzzer already pressed by another team");
            result.put("winnerTeamId", winner);
        }

        return result;
    }

    private void startAnswerTimer(Long competitionId) {
        String timerKey = ANSWER_TIME_LIMIT + competitionId;
        redisTemplate.opsForValue().set(timerKey, System.currentTimeMillis() + 10000, 12, TimeUnit.SECONDS);
        broadcastMessage(competitionId, "ANSWER_TIMER_STARTED", 10);
    }

    private void clearAnswerTimer(Long competitionId) {
        String timerKey = ANSWER_TIME_LIMIT + competitionId;
        redisTemplate.delete(timerKey);
    }

    private void clearBuzzerLock(Long competitionId) {
        Object winner = redisLockService.getLockValue(BUZZER_LOCK_PREFIX + competitionId);
        if (winner != null) {
            redisLockService.releaseLock(BUZZER_LOCK_PREFIX + competitionId, winner.toString());
        }
    }

    @Transactional
    public Map<String, Object> submitAnswer(SubmitAnswerRequest request) {
        Map<String, Object> result = new HashMap<>();

        Object winner = redisLockService.getLockValue(BUZZER_LOCK_PREFIX + request.getCompetitionId());
        if (winner == null || !winner.toString().equals(String.valueOf(request.getTeamId()))) {
            result.put("success", false);
            result.put("message", "You don't have the answer right");
            return result;
        }

        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        Question question = getCurrentQuestion(request.getCompetitionId());
        if (question == null) {
            result.put("success", false);
            result.put("message", "No current question");
            return result;
        }

        Object timer = redisTemplate.opsForValue().get(ANSWER_TIME_LIMIT + request.getCompetitionId());
        if (timer == null || System.currentTimeMillis() > Long.parseLong(timer.toString())) {
            result.put("success", false);
            result.put("message", "Answer time expired");
            return result;
        }

        AnswerRecord record = new AnswerRecord();
        record.setCompetitionId(request.getCompetitionId());
        record.setQuestionId(question.getId());
        record.setTeamId(request.getTeamId());
        record.setAnswer(request.getAnswer().toUpperCase());
        record.setIsCorrect(request.getAnswer().equalsIgnoreCase(question.getCorrectAnswer()));
        record.setPointsEarned(0);
        answerRecordRepository.save(record);

        result.put("success", true);
        result.put("answerSubmitted", request.getAnswer());
        result.put("awaitingJudge", true);

        broadcastMessage(request.getCompetitionId(), "ANSWER_SUBMITTED", result);
        log.info("Team {} submitted answer for competition {}", request.getTeamId(), request.getCompetitionId());

        return result;
    }

    @Transactional
    public Map<String, Object> judgeAnswer(JudgeAnswerRequest request) {
        Map<String, Object> result = new HashMap<>();

        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        Question question = getCurrentQuestion(request.getCompetitionId());
        if (question == null) {
            result.put("success", false);
            result.put("message", "No current question");
            return result;
        }

        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        List<AnswerRecord> records = answerRecordRepository.findByCompetitionIdAndTeamId(
                request.getCompetitionId(), request.getTeamId());

        AnswerRecord latestRecord = records.stream()
                .filter(r -> r.getQuestionId().equals(question.getId()))
                .max(Comparator.comparing(AnswerRecord::getCreatedAt))
                .orElse(null);

        if (latestRecord != null) {
            latestRecord.setIsCorrect(request.getIsCorrect());
            latestRecord.setPointsEarned(request.getIsCorrect() ? request.getPoints() : 0);
            answerRecordRepository.save(latestRecord);
        }

        if (request.getIsCorrect()) {
            team.setScore(team.getScore() + request.getPoints());
            team.setCorrectCount(team.getCorrectCount() + 1);
        } else {
            team.setWrongCount(team.getWrongCount() + 1);
        }
        teamRepository.save(team);

        if (request.getIsCorrect()) {
            clearBuzzerLock(request.getCompetitionId());
            clearAnswerTimer(request.getCompetitionId());
        }

        Map<String, Object> broadcastData = new HashMap<>();
        broadcastData.put("teamId", request.getTeamId());
        broadcastData.put("teamName", team.getName());
        broadcastData.put("isCorrect", request.getIsCorrect());
        broadcastData.put("pointsEarned", request.getIsCorrect() ? request.getPoints() : 0);
        broadcastData.put("teams", getTeamsWithScores(request.getCompetitionId()));
        broadcastMessage(request.getCompetitionId(), "ANSWER_JUDGED", broadcastData);

        result.put("success", true);
        result.put("teams", getTeamsWithScores(request.getCompetitionId()));
        result.put("canContinueBuzzer", !request.getIsCorrect());

        log.info("Judge decision for team {}: correct={}, points={}", request.getTeamId(), request.getIsCorrect(), request.getPoints());
        return result;
    }

    public Map<String, Object> resetBuzzer(Long competitionId) {
        Map<String, Object> result = new HashMap<>();

        clearBuzzerLock(competitionId);
        clearAnswerTimer(competitionId);

        Map<String, Object> broadcastData = new HashMap<>();
        broadcastData.put("message", "抢答已重置，可继续抢答");
        broadcastMessage(competitionId, "BUZZER_RESET", broadcastData);

        result.put("success", true);
        result.put("message", "抢答锁已释放，可继续抢答");

        log.info("Buzzer reset for competition {}", competitionId);
        return result;
    }

    @Transactional
    public void finishCompetition(Long competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        competition.setStatus(CompetitionStatus.FINISHED);
        competition.setFinishedAt(LocalDateTime.now());
        competitionRepository.save(competition);

        clearBuzzerLock(competitionId);
        clearAnswerTimer(competitionId);

        Map<String, Object> result = new HashMap<>();
        result.put("teams", getTeamsWithScores(competitionId));
        result.put("statistics", getCompetitionStatistics(competitionId));
        broadcastMessage(competitionId, "COMPETITION_FINISHED", result);

        log.info("Competition finished: {}", competitionId);
    }

    public List<Team> getTeamsWithScores(Long competitionId) {
        return teamRepository.findByCompetitionIdOrderByScoreDesc(competitionId);
    }

    public Map<String, Object> getCompetitionStatistics(Long competitionId) {
        Map<String, Object> stats = new HashMap<>();

        Competition competition = competitionRepository.findById(competitionId).orElse(null);
        if (competition == null) {
            return stats;
        }

        List<Team> teams = getTeamsWithScores(competitionId);
        List<AnswerRecord> allRecords = answerRecordRepository.findByCompetitionId(competitionId);

        stats.put("competition", competition);
        stats.put("teams", teams);
        stats.put("totalAnswers", allRecords.size());
        stats.put("correctAnswers", allRecords.stream().filter(AnswerRecord::getIsCorrect).count());
        stats.put("wrongAnswers", allRecords.stream().filter(r -> !r.getIsCorrect()).count());

        if (!teams.isEmpty()) {
            stats.put("winner", teams.get(0));
        }

        return stats;
    }

    public List<Competition> getAllCompetitions() {
        return competitionRepository.findAll();
    }

    public Competition getCompetitionById(Long id) {
        return competitionRepository.findById(id).orElse(null);
    }

    private void broadcastMessage(Long competitionId, String type, Object data) {
        WebSocketMessage message = WebSocketMessage.builder()
                .type(type)
                .data(data)
                .competitionId(competitionId)
                .build();
        messagingTemplate.convertAndSend("/topic/competition/" + competitionId, message);
    }
}
