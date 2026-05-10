package com.lightpollution.service;

import com.lightpollution.dto.ObservationRequest;
import com.lightpollution.entity.Challenge;
import com.lightpollution.entity.ChallengeLog;
import com.lightpollution.entity.Observation;
import com.lightpollution.repository.ChallengeLogRepository;
import com.lightpollution.repository.ChallengeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ChallengeService {

    @Autowired
    private ChallengeRepository challengeRepository;

    @Autowired
    private ChallengeLogRepository challengeLogRepository;

    @Autowired
    private ObservationService observationService;

    private static final int CHALLENGE_DAYS = 7;

    @Transactional
    public Map<String, Object> startChallenge(Long userId, BigDecimal latitude, BigDecimal longitude) {
        Optional<Challenge> existingActive = challengeRepository.findByUserIdAndStatus(userId, "ACTIVE");
        if (existingActive.isPresent()) {
            throw new RuntimeException("您已有一个进行中的挑战");
        }

        Challenge challenge = new Challenge();
        challenge.setUserId(userId);
        challenge.setStartDate(LocalDate.now());
        challenge.setLatitude(latitude);
        challenge.setLongitude(longitude);
        challenge.setStatus("ACTIVE");
        challenge.setStreakDays(0);

        Challenge saved = challengeRepository.save(challenge);
        
        Map<String, Object> result = new HashMap<>();
        result.put("challengeId", saved.getId());
        result.put("startDate", saved.getStartDate());
        result.put("expectedEndDate", saved.getStartDate().plusDays(CHALLENGE_DAYS - 1));
        result.put("status", saved.getStatus());
        
        return result;
    }

    @Transactional
    public Map<String, Object> checkIn(Long userId, ObservationRequest request) {
        Optional<Challenge> activeChallenge = challengeRepository.findByUserIdAndStatus(userId, "ACTIVE");
        if (!activeChallenge.isPresent()) {
            throw new RuntimeException("没有进行中的挑战");
        }

        Challenge challenge = activeChallenge.get();
        LocalDate today = LocalDate.now();
        
        if (challengeLogRepository.existsByChallengeIdAndLogDate(challenge.getId(), today)) {
            throw new RuntimeException("今天已经打卡过了");
        }

        if (today.isAfter(challenge.getStartDate().plusDays(CHALLENGE_DAYS - 1))) {
            challenge.setStatus("FAILED");
            challengeRepository.save(challenge);
            throw new RuntimeException("挑战已过期");
        }

        BigDecimal tolerance = new BigDecimal("0.01");
        if (request.getLatitude().subtract(challenge.getLatitude()).abs().compareTo(tolerance) > 0
            || request.getLongitude().subtract(challenge.getLongitude()).abs().compareTo(tolerance) > 0) {
            throw new RuntimeException("打卡位置需要与挑战位置一致（误差约1公里内）");
        }

        Observation observation = observationService.createObservation(userId, request);

        ChallengeLog log = new ChallengeLog();
        log.setChallengeId(challenge.getId());
        log.setObservationId(observation.getId());
        log.setLogDate(today);
        challengeLogRepository.save(log);

        long loggedDays = challengeLogRepository.countByChallengeId(challenge.getId());
        challenge.setStreakDays((int) loggedDays);

        Map<String, Object> result = new HashMap<>();
        result.put("logged", true);
        result.put("streakDays", loggedDays);
        result.put("totalDays", CHALLENGE_DAYS);
        result.put("remainingDays", CHALLENGE_DAYS - loggedDays);

        if (loggedDays >= CHALLENGE_DAYS) {
            challenge.setStatus("COMPLETED");
            challenge.setEndDate(today);
            result.put("completed", true);
            result.put("message", "恭喜！您已完成暗夜挑战！");
        } else {
            result.put("completed", false);
            result.put("message", "打卡成功！继续保持！");
        }

        challengeRepository.save(challenge);
        return result;
    }

    public List<Map<String, Object>> getUserChallenges(Long userId) {
        List<Challenge> challenges = challengeRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Challenge challenge : challenges) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", challenge.getId());
            map.put("startDate", challenge.getStartDate());
            map.put("endDate", challenge.getEndDate());
            map.put("latitude", challenge.getLatitude());
            map.put("longitude", challenge.getLongitude());
            map.put("status", challenge.getStatus());
            map.put("streakDays", challenge.getStreakDays());
            map.put("totalDays", CHALLENGE_DAYS);
            map.put("createdAt", challenge.getCreatedAt());

            if ("ACTIVE".equals(challenge.getStatus())) {
                LocalDate today = LocalDate.now();
                LocalDate deadline = challenge.getStartDate().plusDays(CHALLENGE_DAYS - 1);
                long daysLeft = ChronoUnit.DAYS.between(today, deadline) + 1;
                map.put("daysLeft", Math.max(0, daysLeft));
                map.put("deadline", deadline);
            }

            result.add(map);
        }

        return result;
    }

    public Optional<Challenge> getActiveChallenge(Long userId) {
        return challengeRepository.findByUserIdAndStatus(userId, "ACTIVE");
    }
}
