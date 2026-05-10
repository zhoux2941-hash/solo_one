package com.meteor.service;

import com.meteor.dto.ConsensusRadiantResult;
import com.meteor.dto.CreateSessionRequest;
import com.meteor.dto.RadiantPointResult;
import com.meteor.dto.SessionDetailResponse;
import com.meteor.dto.ZHRResult;
import com.meteor.entity.MeteorRecord;
import com.meteor.entity.MeteorShower;
import com.meteor.entity.ObservationSession;
import com.meteor.repository.MeteorRecordRepository;
import com.meteor.repository.MeteorShowerRepository;
import com.meteor.repository.ObservationSessionRepository;
import com.meteor.util.RadiantPointCalculator;
import com.meteor.util.ZHRCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class ObservationSessionService {

    @Autowired
    private ObservationSessionRepository sessionRepository;

    @Autowired
    private MeteorRecordRepository recordRepository;

    @Autowired
    private MeteorShowerRepository meteorShowerRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String SHOWER_SESSIONS_CACHE_KEY = "meteor:sessions:";
    private static final long CACHE_TTL = 30;

    @Transactional
    public ObservationSession createSession(CreateSessionRequest request) {
        ObservationSession session = new ObservationSession();
        session.setMeteorShowerName(request.getMeteorShowerName());
        session.setLocation(request.getLocation());
        session.setLatitude(request.getLatitude());
        session.setLongitude(request.getLongitude());
        session.setStartTime(request.getStartTime());
        session.setUserName(request.getUserName());
        session.setDescription(request.getDescription());
        session.setCloudCover(request.getCloudCover());
        session.setLimitingMagnitude(request.getLimitingMagnitude());
        session.setStatus("ACTIVE");

        ObservationSession saved = sessionRepository.save(session);
        evictSessionsCache(request.getMeteorShowerName());
        return saved;
    }

    public Optional<ObservationSession> getSession(Long id) {
        return sessionRepository.findById(id);
    }

    public SessionDetailResponse getSessionDetail(Long id) {
        ObservationSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<MeteorRecord> records = recordRepository.findBySessionIdOrderByObservedTimeAsc(id);
        Optional<RadiantPointResult> radiantPoint = RadiantPointCalculator.calculateRadiantPoint(records);

        ZHRResult zhrResult = calculateZHRForSession(session, records);
        Integer predictedZHR = getPredictedZHR(session.getMeteorShowerName());
        Double zhrComparison = zhrResult != null && predictedZHR != null && predictedZHR > 0
                ? (zhrResult.getZhr() / predictedZHR * 100.0)
                : null;

        return new SessionDetailResponse(session, records, radiantPoint.orElse(null), 
                zhrResult, predictedZHR, zhrComparison);
    }

    @Transactional
    public ObservationSession endSession(Long id) {
        ObservationSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<MeteorRecord> records = recordRepository.findBySessionIdOrderByObservedTimeAsc(id);
        Optional<RadiantPointResult> radiantPoint = RadiantPointCalculator.calculateRadiantPoint(records);

        if (radiantPoint.isPresent()) {
            RadiantPointResult result = radiantPoint.get();
            session.setRadiantConstellation(result.getConstellation());
            session.setRadiantRA(result.getRa());
            session.setRadiantDec(result.getDec());
        }

        session.setEndTime(LocalDateTime.now());
        session.setStatus("COMPLETED");

        ZHRResult zhrResult = calculateZHRForSession(session, records);
        if (zhrResult != null) {
            session.setCalculatedZHR(zhrResult.getZhr());
            session.setZhrConfidence(zhrResult.getConfidence());
            session.setObservedMeteorCount(zhrResult.getMeteorCount());
            session.setObservationDurationMinutes((int) Math.round(zhrResult.getDurationHours() * 60));
        }

        ObservationSession saved = sessionRepository.save(session);
        evictSessionsCache(session.getMeteorShowerName());
        return saved;
    }

    private ZHRResult calculateZHRForSession(ObservationSession session, List<MeteorRecord> records) {
        LocalDateTime startTime = session.getStartTime();
        LocalDateTime endTime = session.getEndTime();
        if (endTime == null) {
            endTime = LocalDateTime.now();
        }

        long durationMinutes = Duration.between(startTime, endTime).toMinutes();
        if (durationMinutes <= 0) {
            durationMinutes = 1;
        }

        Double radiantAltitude = null;
        if (session.getLatitude() != null && session.getLongitude() != null
                && session.getRadiantRA() != null && session.getRadiantDec() != null) {
            radiantAltitude = ZHRCalculator.estimateRadiantAltitude(
                    session.getLatitude(),
                    session.getLongitude(),
                    session.getRadiantRA(),
                    session.getRadiantDec(),
                    endTime
            );
        }

        int meteorCount = records.size();

        com.meteor.util.ZHRCalculator.ZHRResult utilResult = ZHRCalculator.calculateZHR(
                meteorCount,
                durationMinutes,
                session.getCloudCover(),
                session.getLimitingMagnitude(),
                radiantAltitude
        );

        ZHRResult dtoResult = new ZHRResult();
        dtoResult.setZhr(utilResult.getZhr());
        dtoResult.setRawRate(utilResult.getRawRate());
        dtoResult.setDurationHours(utilResult.getDurationHours());
        dtoResult.setMeteorCount(utilResult.getMeteorCount());
        dtoResult.setCloudCorrection(utilResult.getCloudCorrection());
        dtoResult.setLmCorrection(utilResult.getLmCorrection());
        dtoResult.setZenithCorrection(utilResult.getZenithCorrection());
        dtoResult.setConfidence(utilResult.getConfidence());
        dtoResult.setNotes(utilResult.getNotes());

        return dtoResult;
    }

    private Integer getPredictedZHR(String showerName) {
        if (showerName == null) return null;
        return meteorShowerRepository.findAllByOrderByPeakTimeDesc().stream()
                .filter(s -> showerName.equals(s.getName()))
                .findFirst()
                .map(MeteorShower::getPredictedZHR)
                .orElse(null);
    }

    @SuppressWarnings("unchecked")
    public List<ObservationSession> getSessionsByShowerName(String showerName) {
        String cacheKey = SHOWER_SESSIONS_CACHE_KEY + showerName;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (List<ObservationSession>) cached;
        }

        List<ObservationSession> sessions = sessionRepository.findByMeteorShowerNameOrderByStartTimeDesc(showerName);
        redisTemplate.opsForValue().set(cacheKey, sessions, CACHE_TTL, TimeUnit.MINUTES);
        return sessions;
    }

    public List<ObservationSession> getActiveSessions() {
        return sessionRepository.findActiveSessions();
    }

    public ConsensusRadiantResult getConsensusRadiant(String showerName) {
        List<ObservationSession> allSessions = sessionRepository.findByMeteorShowerNameOrderByStartTimeDesc(showerName);
        List<ObservationSession> sessionsWithRadiant = allSessions.stream()
                .filter(s -> s.getRadiantConstellation() != null)
                .collect(Collectors.toList());

        if (sessionsWithRadiant.isEmpty()) {
            return new ConsensusRadiantResult(
                    showerName, null, null, null,
                    allSessions.size(), 0, new HashMap<>(), 0.0
            );
        }

        Map<String, Long> constellationCounts = sessionsWithRadiant.stream()
                .collect(Collectors.groupingBy(
                        ObservationSession::getRadiantConstellation,
                        Collectors.counting()
                ));

        String consensusConstellation = constellationCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        List<ObservationSession> consensusSessions = sessionsWithRadiant.stream()
                .filter(s -> s.getRadiantConstellation().equals(consensusConstellation))
                .collect(Collectors.toList());

        double avgRA = consensusSessions.stream()
                .filter(s -> s.getRadiantRA() != null)
                .mapToDouble(ObservationSession::getRadiantRA)
                .average()
                .orElse(0);

        double avgDec = consensusSessions.stream()
                .filter(s -> s.getRadiantDec() != null)
                .mapToDouble(ObservationSession::getRadiantDec)
                .average()
                .orElse(0);

        long maxCount = constellationCounts.values().stream()
                .max(Long::compare)
                .orElse(0L);

        double confidence = (double) maxCount / sessionsWithRadiant.size();

        return new ConsensusRadiantResult(
                showerName,
                consensusConstellation,
                avgRA,
                avgDec,
                allSessions.size(),
                sessionsWithRadiant.size(),
                constellationCounts,
                confidence
        );
    }

    private void evictSessionsCache(String showerName) {
        redisTemplate.delete(SHOWER_SESSIONS_CACHE_KEY + showerName);
    }
}
