package com.swimming.lanematcher.service;

import com.swimming.lanematcher.config.LaneConfig;
import com.swimming.lanematcher.dto.FeedbackRequest;
import com.swimming.lanematcher.dto.RecommendationRequest;
import com.swimming.lanematcher.dto.RecommendationResponse;
import com.swimming.lanematcher.entity.LaneWeight;
import com.swimming.lanematcher.entity.SpeedHistory;
import com.swimming.lanematcher.entity.UserFeedback;
import com.swimming.lanematcher.repository.LaneWeightRepository;
import com.swimming.lanematcher.repository.SpeedHistoryRepository;
import com.swimming.lanematcher.repository.UserFeedbackRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationService.class);

    private final LaneConfig laneConfig;
    private final SpeedHistoryRepository speedHistoryRepository;
    private final UserFeedbackRepository userFeedbackRepository;
    private final LaneWeightRepository laneWeightRepository;
    private final LaneLoadService laneLoadService;

    public RecommendationService(LaneConfig laneConfig,
                                  SpeedHistoryRepository speedHistoryRepository,
                                  UserFeedbackRepository userFeedbackRepository,
                                  LaneWeightRepository laneWeightRepository,
                                  LaneLoadService laneLoadService) {
        this.laneConfig = laneConfig;
        this.speedHistoryRepository = speedHistoryRepository;
        this.userFeedbackRepository = userFeedbackRepository;
        this.laneWeightRepository = laneWeightRepository;
        this.laneLoadService = laneLoadService;
        
        initializeLaneWeights();
    }

    private void initializeLaneWeights() {
        for (LaneConfig.LaneSetting lane : laneConfig.getLanes()) {
            if (laneWeightRepository.findByLaneId(lane.getId()).isEmpty()) {
                LaneWeight weight = new LaneWeight(lane.getId());
                weight.setSpeedCategory(getSpeedCategoryForLane(lane));
                laneWeightRepository.save(weight);
                logger.info("Initialized lane weight for lane {} with category {}", 
                    lane.getId(), weight.getSpeedCategory());
            }
        }
    }

    private String getSpeedCategoryForLane(LaneConfig.LaneSetting lane) {
        if (lane.getMaxSpeed() <= 1.0) {
            return "快速";
        } else if (lane.getMaxSpeed() <= 1.5) {
            return "中速";
        } else {
            return "慢速";
        }
    }

    public RecommendationResponse recommendLane(RecommendationRequest request) {
        Double speed = request.getSpeed();
        String userId = request.getUserId() != null ? request.getUserId() : "anonymous";

        logger.info("Received recommendation request for speed: {} min/50m, userId: {}", speed, userId);

        Map<Integer, Double> laneWeights = getLaneWeights();
        Map<Integer, Integer> laneLoads = laneLoadService.getAllLaneLoads();
        Map<Integer, Integer> feedbackCounts = getFeedbackCounts();

        List<LaneConfig.LaneSetting> eligibleLanes = laneConfig.getLanes().stream()
                .filter(lane -> isEligibleLane(lane, speed))
                .collect(Collectors.toList());

        logger.info("Found {} eligible lanes for speed: {}", eligibleLanes.size(), speed);

        LaneConfig.LaneSetting recommendedLane = selectBestLane(eligibleLanes, laneWeights, laneLoads, speed);

        SpeedHistory history = new SpeedHistory(userId, speed, recommendedLane != null ? recommendedLane.getId() : null);
        SpeedHistory savedHistory = speedHistoryRepository.save(history);

        if (recommendedLane != null) {
            laneLoadService.incrementLaneLoad(recommendedLane.getId());
            incrementRecommendationCount(recommendedLane.getId());
        }

        RecommendationResponse response = new RecommendationResponse();
        response.setHistoryId(savedHistory.getId());
        response.setUserSpeed(speed);
        response.setSpeedCategory(getSpeedCategory(speed));
        response.setRecommendedLaneId(recommendedLane != null ? recommendedLane.getId() : null);
        response.setRecommendedLaneName(recommendedLane != null ? recommendedLane.getName() : null);
        
        if (recommendedLane != null) {
            Integer currentLoad = laneLoads.getOrDefault(recommendedLane.getId(), 0);
            String crowdLevel = laneLoadService.getCrowdLevel(currentLoad);
            response.setMessage(String.format("推荐您使用 %s，当前%s（%d人）。", 
                recommendedLane.getName(), crowdLevel, currentLoad));
        } else {
            response.setMessage("抱歉，暂时没有适合您速度的泳道。");
        }

        List<RecommendationResponse.LaneInfo> laneInfos = laneConfig.getLanes().stream()
                .map(lane -> {
                    Integer load = laneLoads.getOrDefault(lane.getId(), 0);
                    RecommendationResponse.LaneInfo info = new RecommendationResponse.LaneInfo();
                    info.setId(lane.getId());
                    info.setName(lane.getName());
                    info.setMinSpeed(lane.getMinSpeed());
                    info.setMaxSpeed(lane.getMaxSpeed());
                    info.setCurrentLoad(load);
                    info.setMaxOccupancy(laneLoadService.getMaxOccupancy());
                    info.setCrowdLevel(laneLoadService.getCrowdLevel(load));
                    info.setCrowdLevelClass(laneLoadService.getCrowdLevelClass(load));
                    info.setFeedbackCount(feedbackCounts.getOrDefault(lane.getId(), 0));
                    info.setIsRecommended(recommendedLane != null && recommendedLane.getId().equals(lane.getId()));
                    return info;
                })
                .collect(Collectors.toList());

        response.setAllLanes(laneInfos);

        return response;
    }

    public Map<String, Object> getRealtimeLaneStatus() {
        Map<String, Object> result = new HashMap<>();
        Map<Integer, Integer> laneLoads = laneLoadService.getAllLaneLoads();
        List<Map<String, Object>> lanes = new ArrayList<>();
        
        for (LaneConfig.LaneSetting lane : laneConfig.getLanes()) {
            Integer load = laneLoads.getOrDefault(lane.getId(), 0);
            Map<String, Object> laneInfo = new HashMap<>();
            laneInfo.put("laneId", lane.getId());
            laneInfo.put("name", lane.getName());
            laneInfo.put("currentLoad", load);
            laneInfo.put("maxOccupancy", laneLoadService.getMaxOccupancy());
            laneInfo.put("crowdLevel", laneLoadService.getCrowdLevel(load));
            laneInfo.put("crowdLevelClass", laneLoadService.getCrowdLevelClass(load));
            laneInfo.put("loadFactor", String.format("%.0f%%", laneLoadService.getLoadFactor(load) * 100));
            lanes.add(laneInfo);
        }
        
        result.put("lanes", lanes);
        result.put("lastUpdated", new Date());
        return result;
    }

    @Transactional
    public Map<String, Object> submitFeedback(FeedbackRequest request) {
        logger.info("Received feedback: recommended={}, actual={}, speed={}", 
            request.getRecommendedLaneId(), request.getActualLaneId(), request.getSpeed());

        boolean isMatch = request.getRecommendedLaneId() != null && 
                         request.getRecommendedLaneId().equals(request.getActualLaneId());

        UserFeedback feedback = new UserFeedback(
            request.getHistoryId(),
            request.getUserId(),
            request.getRecommendedLaneId(),
            request.getActualLaneId(),
            request.getSpeed()
        );
        userFeedbackRepository.save(feedback);

        updateLaneWeights(request.getRecommendedLaneId(), request.getActualLaneId(), isMatch);

        logger.info("Feedback processed: isMatch={}, recommendedLaneWeightUpdate, actualLaneWeightUpdate", isMatch);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("isMatch", isMatch);
        result.put("message", isMatch 
            ? "感谢您的反馈！推荐结果与您的选择一致，已增加该泳道的推荐权重。"
            : "感谢您的反馈！您选择了不同的泳道，系统已调整相关泳道权重，下次推荐将更准确。");

        return result;
    }

    private void updateLaneWeights(Integer recommendedLaneId, Integer actualLaneId, boolean isMatch) {
        if (actualLaneId != null) {
            LaneWeight actualWeight = getOrCreateLaneWeight(actualLaneId);
            actualWeight.setActualSelectionCount(actualWeight.getActualSelectionCount() + 1);
            
            if (isMatch) {
                actualWeight.setMatchCount(actualWeight.getMatchCount() + 1);
                logger.info("Match feedback: incremented matchCount for lane {}", actualLaneId);
            }
            actualWeight.recalculateTotalWeight();
            laneWeightRepository.save(actualWeight);
        }

        if (recommendedLaneId != null && !isMatch) {
            LaneWeight recommendedWeight = getOrCreateLaneWeight(recommendedLaneId);
            recommendedWeight.setMismatchCount(recommendedWeight.getMismatchCount() + 1);
            recommendedWeight.recalculateTotalWeight();
            laneWeightRepository.save(recommendedWeight);
            logger.info("Mismatch feedback: incremented mismatchCount for lane {}", recommendedLaneId);
        }
    }

    private LaneWeight getOrCreateLaneWeight(Integer laneId) {
        return laneWeightRepository.findByLaneId(laneId)
                .orElseGet(() -> {
                    LaneConfig.LaneSetting lane = laneConfig.getLanes().stream()
                            .filter(l -> l.getId().equals(laneId))
                            .findFirst()
                            .orElse(null);
                    LaneWeight weight = new LaneWeight(laneId);
                    if (lane != null) {
                        weight.setSpeedCategory(getSpeedCategoryForLane(lane));
                    }
                    return weight;
                });
    }

    private void incrementRecommendationCount(Integer laneId) {
        LaneWeight weight = getOrCreateLaneWeight(laneId);
        weight.setRecommendationCount(weight.getRecommendationCount() + 1);
        laneWeightRepository.save(weight);
    }

    public List<SpeedHistory> getRecentHistory() {
        return speedHistoryRepository.findTop10ByOrderByCreatedAtDesc();
    }

    public List<UserFeedback> getRecentFeedback() {
        return userFeedbackRepository.findAllOrderByCreatedAtDesc();
    }

    public List<LaneWeight> getLaneWeightStats() {
        return laneWeightRepository.findAllByOrderByLaneIdAsc();
    }

    public Map<String, Object> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
        List<LaneWeight> weights = laneWeightRepository.findAllByOrderByLaneIdAsc();
        List<Map<String, Object>> weightStats = new ArrayList<>();
        
        for (LaneWeight w : weights) {
            Map<String, Object> stat = new HashMap<>();
            stat.put("laneId", w.getLaneId());
            stat.put("speedCategory", w.getSpeedCategory());
            stat.put("baseWeight", w.getBaseWeight());
            stat.put("feedbackWeight", String.format("%.4f", w.getFeedbackWeight()));
            stat.put("totalWeight", String.format("%.4f", w.getTotalWeight()));
            stat.put("recommendationCount", w.getRecommendationCount());
            stat.put("actualSelectionCount", w.getActualSelectionCount());
            stat.put("matchCount", w.getMatchCount());
            stat.put("mismatchCount", w.getMismatchCount());
            
            double matchRate = w.getRecommendationCount() > 0 
                ? (double) w.getMatchCount() / w.getRecommendationCount() * 100 
                : 0;
            stat.put("matchRate", String.format("%.2f%%", matchRate));
            stat.put("lastUpdated", w.getLastUpdated());
            
            weightStats.add(stat);
        }
        
        analytics.put("laneWeights", weightStats);
        
        long totalFeedback = userFeedbackRepository.count();
        analytics.put("totalFeedback", totalFeedback);
        
        long totalHistory = speedHistoryRepository.count();
        analytics.put("totalRecommendations", totalHistory);
        
        return analytics;
    }

    private boolean isEligibleLane(LaneConfig.LaneSetting lane, Double speed) {
        if (lane.getMaxSpeed() >= 99.0) {
            return speed >= lane.getMinSpeed();
        }
        return speed >= lane.getMinSpeed() && speed <= lane.getMaxSpeed();
    }

    private LaneConfig.LaneSetting selectBestLane(List<LaneConfig.LaneSetting> eligibleLanes,
                                                   Map<Integer, Double> laneWeights,
                                                   Map<Integer, Integer> laneLoads,
                                                   Double speed) {
        if (eligibleLanes.isEmpty()) {
            return null;
        }

        if (eligibleLanes.size() == 1) {
            return eligibleLanes.get(0);
        }

        Comparator<LaneConfig.LaneSetting> comparator = Comparator
                .comparingInt((LaneConfig.LaneSetting lane) -> laneLoads.getOrDefault(lane.getId(), 0))
                .thenComparingDouble((LaneConfig.LaneSetting lane) -> {
                    double weight = laneWeights.getOrDefault(lane.getId(), 1.0);
                    return -weight;
                })
                .thenComparingDouble(lane -> {
                    double laneMid = (lane.getMinSpeed() + lane.getMaxSpeed()) / 2;
                    return Math.abs(speed - laneMid);
                });

        LaneConfig.LaneSetting bestLane = eligibleLanes.stream()
                .min(comparator)
                .orElse(eligibleLanes.get(0));

        logger.info("Selected lane {} for speed {} (load: {}, weight: {})", 
            bestLane.getId(), speed, 
            laneLoads.getOrDefault(bestLane.getId(), 0),
            laneWeights.getOrDefault(bestLane.getId(), 1.0));

        return bestLane;
    }

    private String getSpeedCategory(Double speed) {
        if (speed < 1.0) {
            return "快速";
        } else if (speed <= 1.5) {
            return "中速";
        } else {
            return "慢速";
        }
    }

    private Map<Integer, Double> getLaneWeights() {
        Map<Integer, Double> weights = new HashMap<>();
        List<LaneWeight> laneWeights = laneWeightRepository.findAll();
        for (LaneWeight w : laneWeights) {
            weights.put(w.getLaneId(), w.getTotalWeight());
        }
        return weights;
    }

    private Map<Integer, Integer> getFeedbackCounts() {
        Map<Integer, Integer> counts = new HashMap<>();
        try {
            List<Object[]> results = userFeedbackRepository.countByActualLaneId();
            for (Object[] result : results) {
                Integer laneId = (Integer) result[0];
                Long count = (Long) result[1];
                counts.put(laneId, count.intValue());
            }
        } catch (Exception e) {
            logger.warn("Failed to get feedback counts from database", e);
        }
        return counts;
    }

    public List<LaneConfig.LaneSetting> getAllLanes() {
        return laneConfig.getLanes();
    }
}