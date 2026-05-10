package com.milktea.predictor.service.impl;

import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.milktea.predictor.dto.FeedbackRequest;
import com.milktea.predictor.dto.PredictRequest;
import com.milktea.predictor.dto.PredictResponse;
import com.milktea.predictor.dto.RecommendedCombination;
import com.milktea.predictor.entity.ComboWeight;
import com.milktea.predictor.entity.RatingFeedback;
import com.milktea.predictor.entity.RatingRecord;
import com.milktea.predictor.entity.TeaBase;
import com.milktea.predictor.entity.Topping;
import com.milktea.predictor.mapper.ComboWeightMapper;
import com.milktea.predictor.mapper.RatingFeedbackMapper;
import com.milktea.predictor.mapper.RatingRecordMapper;
import com.milktea.predictor.mapper.TeaBaseMapper;
import com.milktea.predictor.mapper.ToppingMapper;
import com.milktea.predictor.service.PredictService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictServiceImpl implements PredictService {

    private final TeaBaseMapper teaBaseMapper;
    private final ToppingMapper toppingMapper;
    private final RatingRecordMapper ratingRecordMapper;
    private final RatingFeedbackMapper ratingFeedbackMapper;
    private final ComboWeightMapper comboWeightMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String HOT_COMBINATIONS_KEY = "milk_tea:hot_combinations";
    private static final int CACHE_TTL_HOURS = 1;
    
    private static final int MIN_FEEDBACK_COUNT_FOR_WEIGHT = 1;
    private static final double LEARNING_RATE = 0.3;

    private static final Map<String, Double> TEA_BASE_BASE_SCORE = new HashMap<>();
    private static final Map<String, Double> TOPPING_BASE_SCORE = new HashMap<>();
    private static final Map<String, Double> TEA_TOPPING_SYNERGY = new HashMap<>();
    private static final Map<String, Double> TOPPING_COMBINATION_SCORE = new HashMap<>();
    private static final Map<String, Double> FULL_COMBINATION_SCORE = new HashMap<>();

    static {
        TEA_BASE_BASE_SCORE.put("红茶", 7.5);
        TEA_BASE_BASE_SCORE.put("绿茶", 7.0);
        TEA_BASE_BASE_SCORE.put("乌龙", 8.0);

        TOPPING_BASE_SCORE.put("珍珠", 8.5);
        TOPPING_BASE_SCORE.put("椰果", 7.0);
        TOPPING_BASE_SCORE.put("仙草", 7.5);
        TOPPING_BASE_SCORE.put("布丁", 8.0);
        TOPPING_BASE_SCORE.put("爆珠", 8.5);

        TEA_TOPPING_SYNERGY.put("红茶_珍珠", 1.0);
        TEA_TOPPING_SYNERGY.put("红茶_布丁", 0.8);
        TEA_TOPPING_SYNERGY.put("红茶_仙草", 1.2);
        TEA_TOPPING_SYNERGY.put("红茶_椰果", 0.5);
        TEA_TOPPING_SYNERGY.put("红茶_爆珠", 0.6);
        TEA_TOPPING_SYNERGY.put("绿茶_椰果", 1.2);
        TEA_TOPPING_SYNERGY.put("绿茶_爆珠", 0.8);
        TEA_TOPPING_SYNERGY.put("绿茶_珍珠", 0.6);
        TEA_TOPPING_SYNERGY.put("绿茶_仙草", 0.7);
        TEA_TOPPING_SYNERGY.put("绿茶_布丁", 0.5);
        TEA_TOPPING_SYNERGY.put("乌龙_珍珠", 0.5);
        TEA_TOPPING_SYNERGY.put("乌龙_布丁", 1.0);
        TEA_TOPPING_SYNERGY.put("乌龙_仙草", 0.8);
        TEA_TOPPING_SYNERGY.put("乌龙_椰果", 0.6);
        TEA_TOPPING_SYNERGY.put("乌龙_爆珠", 0.5);

        TOPPING_COMBINATION_SCORE.put("珍珠_布丁", 1.5);
        TOPPING_COMBINATION_SCORE.put("仙草_珍珠", 1.8);
        TOPPING_COMBINATION_SCORE.put("椰果_爆珠", 1.0);
        TOPPING_COMBINATION_SCORE.put("仙草_布丁", 1.2);
        TOPPING_COMBINATION_SCORE.put("珍珠_爆珠", 0.8);
        TOPPING_COMBINATION_SCORE.put("仙草_椰果", 0.9);
        TOPPING_COMBINATION_SCORE.put("布丁_爆珠", 0.7);
        TOPPING_COMBINATION_SCORE.put("珍珠_椰果", 0.6);

        FULL_COMBINATION_SCORE.put("红茶:珍珠", 9.2);
        FULL_COMBINATION_SCORE.put("红茶:仙草", 8.5);
        FULL_COMBINATION_SCORE.put("红茶:布丁", 8.7);
        FULL_COMBINATION_SCORE.put("红茶:珍珠,仙草", 9.5);
        FULL_COMBINATION_SCORE.put("红茶:珍珠,布丁", 9.3);
        FULL_COMBINATION_SCORE.put("红茶:仙草,布丁", 8.8);
        FULL_COMBINATION_SCORE.put("红茶:珍珠,仙草,布丁", 8.6);
        FULL_COMBINATION_SCORE.put("绿茶:椰果", 8.5);
        FULL_COMBINATION_SCORE.put("绿茶:爆珠", 8.2);
        FULL_COMBINATION_SCORE.put("绿茶:椰果,爆珠", 9.0);
        FULL_COMBINATION_SCORE.put("乌龙:珍珠", 8.5);
        FULL_COMBINATION_SCORE.put("乌龙:布丁", 9.0);
        FULL_COMBINATION_SCORE.put("乌龙:仙草", 8.7);
        FULL_COMBINATION_SCORE.put("乌龙:珍珠,布丁", 9.5);
        FULL_COMBINATION_SCORE.put("乌龙:仙草,布丁", 8.8);
        FULL_COMBINATION_SCORE.put("乌龙:珍珠,仙草", 8.5);
    }

    @Override
    public PredictResponse predict(PredictRequest request) {
        String teaBase = request.getTeaBase();
        List<String> toppings = Optional.ofNullable(request.getToppings()).orElse(Collections.emptyList());
        
        BigDecimal predictedRating = calculateRating(teaBase, toppings);
        String ratingDescription = getRatingDescription(predictedRating);
        
        savePredictionRecord(teaBase, toppings, predictedRating);
        updateHotCombinations(teaBase, toppings, predictedRating);
        
        List<RecommendedCombination> similarRecommendations = generateSimilarRecommendations(teaBase, toppings);
        List<RecommendedCombination> hotCombinations = getHotCombinations();
        
        return PredictResponse.builder()
                .teaBase(teaBase)
                .toppings(toppings)
                .predictedRating(predictedRating)
                .ratingDescription(ratingDescription)
                .similarRecommendations(similarRecommendations)
                .hotCombinations(hotCombinations)
                .build();
    }

    private BigDecimal calculateRating(String teaBase, List<String> toppings) {
        String comboKey = generateComboKey(teaBase, toppings);
        
        ComboWeight learnedWeight = getLearnedWeight(comboKey);
        if (learnedWeight != null && learnedWeight.getFeedbackCount() >= MIN_FEEDBACK_COUNT_FOR_WEIGHT) {
            log.info("命中学习权重: {} = {} (反馈次数: {}, 权重: {})", 
                    comboKey, learnedWeight.getAvgRating(), 
                    learnedWeight.getFeedbackCount(), learnedWeight.getWeight());
            return learnedWeight.getAvgRating().setScale(1, RoundingMode.HALF_UP);
        }
        
        Double fullScore = FULL_COMBINATION_SCORE.get(comboKey);
        if (fullScore != null) {
            log.info("命中完整组合规则: {} = {}", comboKey, fullScore);
            return BigDecimal.valueOf(fullScore).setScale(1, RoundingMode.HALF_UP);
        }
        
        log.info("未命中规则，使用多维度组合特征计算: {}", comboKey);
        
        double baseScore = TEA_BASE_BASE_SCORE.getOrDefault(teaBase, 6.0);
        double score = baseScore;
        
        if (!toppings.isEmpty()) {
            double toppingTotal = 0;
            for (String topping : toppings) {
                toppingTotal += TOPPING_BASE_SCORE.getOrDefault(topping, 6.0);
            }
            double avgToppingScore = toppingTotal / toppings.size();
            score += (avgToppingScore - 7.0) * 0.25;
        }
        
        double teaToppingSynergy = 0;
        for (String topping : toppings) {
            String key = teaBase + "_" + topping;
            teaToppingSynergy += TEA_TOPPING_SYNERGY.getOrDefault(key, 0.0);
        }
        score += teaToppingSynergy;
        
        double toppingComboScore = 0;
        List<String> sortedToppings = new ArrayList<>(toppings);
        Collections.sort(sortedToppings);
        for (int i = 0; i < sortedToppings.size(); i++) {
            for (int j = i + 1; j < sortedToppings.size(); j++) {
                String pairKey = sortedToppings.get(i) + "_" + sortedToppings.get(j);
                toppingComboScore += TOPPING_COMBINATION_SCORE.getOrDefault(pairKey, 0.0);
            }
        }
        score += toppingComboScore;
        
        if (toppings.isEmpty()) {
            score -= 0.8;
        } else if (toppings.size() == 1) {
            score += 0.2;
        } else if (toppings.size() == 2) {
            score += 0.4;
        } else if (toppings.size() == 3) {
            score += 0.3;
        } else if (toppings.size() == 4) {
            score += 0.1;
        } else if (toppings.size() > 4) {
            score -= (toppings.size() - 4) * 0.4;
        }
        
        if (score < 1.0) score = 1.0;
        if (score > 10.0) score = 10.0;
        
        log.info("多维度计算结果: 茶底分={}, 茶底小料协同={}, 小料组合={}, 最终得分={}", 
                baseScore, teaToppingSynergy, toppingComboScore, score);
        
        return BigDecimal.valueOf(score).setScale(1, RoundingMode.HALF_UP);
    }
    
    private ComboWeight getLearnedWeight(String comboKey) {
        try {
            QueryWrapper<ComboWeight> wrapper = new QueryWrapper<>();
            wrapper.eq("combo_key", comboKey);
            return comboWeightMapper.selectOne(wrapper);
        } catch (Exception e) {
            log.warn("查询学习权重失败: {}", comboKey, e);
            return null;
        }
    }

    private String getRatingDescription(BigDecimal rating) {
        double val = rating.doubleValue();
        if (val >= 9.0) return "神级搭配，绝对爆款！";
        if (val >= 8.0) return "非常受欢迎，强烈推荐！";
        if (val >= 7.0) return "不错的搭配，值得尝试！";
        if (val >= 6.0) return "普通组合，可以一试！";
        return "较为小众，适合口味独特的你";
    }

    private void savePredictionRecord(String teaBase, List<String> toppings, BigDecimal rating) {
        RatingRecord record = new RatingRecord();
        record.setTeaBase(teaBase);
        record.setToppings(JSON.toJSONString(toppings));
        record.setPredictedRating(rating);
        ratingRecordMapper.insert(record);
    }

    @SuppressWarnings("unchecked")
    private void updateHotCombinations(String teaBase, List<String> toppings, BigDecimal rating) {
        try {
            String comboKey = generateComboKey(teaBase, toppings);
            Map<String, Object> hotMap = (Map<String, Object>) redisTemplate.opsForValue().get(HOT_COMBINATIONS_KEY);
            
            if (hotMap == null) {
                hotMap = new HashMap<>();
            }
            
            String dataKey = "data_" + comboKey;
            int count = 1;
            if (hotMap.containsKey(comboKey)) {
                Map<String, Object> existing = (Map<String, Object>) hotMap.get(comboKey);
                count = (int) existing.get("count") + 1;
            }
            
            Map<String, Object> comboData = new HashMap<>();
            comboData.put("teaBase", teaBase);
            comboData.put("toppings", toppings);
            comboData.put("rating", rating);
            comboData.put("count", count);
            
            hotMap.put(comboKey, comboData);
            redisTemplate.opsForValue().set(HOT_COMBINATIONS_KEY, hotMap, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Redis缓存更新失败，继续执行", e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<RecommendedCombination> getHotCombinations() {
        try {
            Map<String, Object> hotMap = (Map<String, Object>) redisTemplate.opsForValue().get(HOT_COMBINATIONS_KEY);
            
            if (hotMap == null || hotMap.isEmpty()) {
                return getDefaultHotCombinations();
            }
            
            List<Map<String, Object>> sorted = hotMap.values().stream()
                    .map(obj -> (Map<String, Object>) obj)
                    .sorted((a, b) -> {
                        int countCompare = Integer.compare((int) b.get("count"), (int) a.get("count"));
                        if (countCompare != 0) return countCompare;
                        return ((BigDecimal) b.get("rating")).compareTo((BigDecimal) a.get("rating"));
                    })
                    .limit(5)
                    .collect(Collectors.toList());
            
            return sorted.stream()
                    .map(data -> RecommendedCombination.builder()
                            .teaBase((String) data.get("teaBase"))
                            .toppings((List<String>) data.get("toppings"))
                            .rating((BigDecimal) data.get("rating"))
                            .description(getRatingDescription((BigDecimal) data.get("rating")))
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("获取热门搭配失败，使用默认数据", e);
            return getDefaultHotCombinations();
        }
    }

    private List<RecommendedCombination> getDefaultHotCombinations() {
        return Arrays.asList(
                RecommendedCombination.builder()
                        .teaBase("乌龙").toppings(Arrays.asList("珍珠", "布丁"))
                        .rating(new BigDecimal("9.5")).description("神级搭配，绝对爆款！").build(),
                RecommendedCombination.builder()
                        .teaBase("红茶").toppings(Arrays.asList("珍珠", "仙草"))
                        .rating(new BigDecimal("9.5")).description("神级搭配，绝对爆款！").build(),
                RecommendedCombination.builder()
                        .teaBase("红茶").toppings(Arrays.asList("珍珠", "布丁"))
                        .rating(new BigDecimal("9.3")).description("神级搭配，绝对爆款！").build(),
                RecommendedCombination.builder()
                        .teaBase("绿茶").toppings(Arrays.asList("椰果", "爆珠"))
                        .rating(new BigDecimal("9.0")).description("非常受欢迎，强烈推荐！").build(),
                RecommendedCombination.builder()
                        .teaBase("乌龙").toppings(Arrays.asList("仙草", "布丁"))
                        .rating(new BigDecimal("8.8")).description("非常受欢迎，强烈推荐！").build()
        );
    }

    private List<RecommendedCombination> generateSimilarRecommendations(String teaBase, List<String> toppings) {
        List<RecommendedCombination> recommendations = new ArrayList<>();
        Set<String> existingCombos = new HashSet<>();
        existingCombos.add(generateComboKey(teaBase, toppings));
        
        for (String topping : getAllToppingNames()) {
            if (!toppings.contains(topping)) {
                List<String> newToppings = new ArrayList<>(toppings);
                newToppings.add(topping);
                String comboKey = generateComboKey(teaBase, newToppings);
                
                if (!existingCombos.contains(comboKey) && newToppings.size() <= 3) {
                    BigDecimal rating = calculateRating(teaBase, newToppings);
                    recommendations.add(RecommendedCombination.builder()
                            .teaBase(teaBase)
                            .toppings(newToppings)
                            .rating(rating)
                            .description(getRatingDescription(rating))
                            .build());
                    existingCombos.add(comboKey);
                }
            }
        }
        
        for (String otherTea : TEA_BASE_BASE_SCORE.keySet()) {
            if (!otherTea.equals(teaBase)) {
                String comboKey = generateComboKey(otherTea, toppings);
                if (!existingCombos.contains(comboKey)) {
                    BigDecimal rating = calculateRating(otherTea, toppings);
                    recommendations.add(RecommendedCombination.builder()
                            .teaBase(otherTea)
                            .toppings(toppings)
                            .rating(rating)
                            .description(getRatingDescription(rating))
                            .build());
                    existingCombos.add(comboKey);
                }
            }
        }
        
        return recommendations.stream()
                .sorted((a, b) -> b.getRating().compareTo(a.getRating()))
                .limit(5)
                .collect(Collectors.toList());
    }

    private List<String> getAllToppingNames() {
        return new ArrayList<>(TOPPING_BASE_SCORE.keySet());
    }

    private String generateComboKey(String teaBase, List<String> toppings) {
        List<String> sorted = new ArrayList<>(toppings);
        Collections.sort(sorted);
        return teaBase + ":" + String.join(",", sorted);
    }

    @Override
    public List<TeaBase> getAllTeaBases() {
        return teaBaseMapper.selectList(null);
    }

    @Override
    public List<Topping> getAllToppings() {
        return toppingMapper.selectList(null);
    }

    @Override
    public List<RatingRecord> getRecentRecords(int limit) {
        QueryWrapper<RatingRecord> wrapper = new QueryWrapper<>();
        wrapper.orderByDesc("create_time").last("LIMIT " + limit);
        return ratingRecordMapper.selectList(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RatingFeedback submitFeedback(FeedbackRequest request) {
        List<String> toppings = Optional.ofNullable(request.getToppings()).orElse(Collections.emptyList());
        String comboKey = generateComboKey(request.getTeaBase(), toppings);
        
        log.info("收到评分反馈: {} -> 预测={}, 实际={}", 
                comboKey, request.getPredictedRating(), request.getActualRating());
        
        RatingFeedback feedback = new RatingFeedback();
        feedback.setTeaBase(request.getTeaBase());
        feedback.setToppings(JSON.toJSONString(toppings));
        feedback.setComboKey(comboKey);
        feedback.setPredictedRating(request.getPredictedRating());
        feedback.setActualRating(request.getActualRating());
        ratingFeedbackMapper.insert(feedback);
        
        updateComboWeight(comboKey, request.getTeaBase(), toppings, request.getActualRating());
        
        return feedback;
    }
    
    private void updateComboWeight(String comboKey, String teaBase, List<String> toppings, Integer actualRating) {
        QueryWrapper<RatingFeedback> feedbackQuery = new QueryWrapper<>();
        feedbackQuery.eq("combo_key", comboKey);
        List<RatingFeedback> allFeedbacks = ratingFeedbackMapper.selectList(feedbackQuery);
        
        if (allFeedbacks.isEmpty()) {
            return;
        }
        
        double totalRating = allFeedbacks.stream()
                .mapToDouble(f -> f.getActualRating().doubleValue())
                .sum();
        int count = allFeedbacks.size();
        double avgRating = totalRating / count;
        
        double predictionError = 0;
        for (RatingFeedback f : allFeedbacks) {
            predictionError += Math.abs(f.getActualRating().doubleValue() - f.getPredictedRating().doubleValue());
        }
        double avgError = predictionError / count;
        double weight = Math.max(0.5, Math.min(1.5, 1.0 + (10.0 - avgError) * 0.05));
        
        QueryWrapper<ComboWeight> weightQuery = new QueryWrapper<>();
        weightQuery.eq("combo_key", comboKey);
        ComboWeight existing = comboWeightMapper.selectOne(weightQuery);
        
        if (existing == null) {
            ComboWeight newWeight = new ComboWeight();
            newWeight.setComboKey(comboKey);
            newWeight.setTeaBase(teaBase);
            newWeight.setToppings(JSON.toJSONString(toppings));
            newWeight.setAvgRating(BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP));
            newWeight.setFeedbackCount(count);
            newWeight.setWeight(BigDecimal.valueOf(weight).setScale(4, RoundingMode.HALF_UP));
            comboWeightMapper.insert(newWeight);
            log.info("新增学习权重: {} = {} ({}条反馈)", comboKey, avgRating, count);
        } else {
            UpdateWrapper<ComboWeight> updateWrapper = new UpdateWrapper<>();
            updateWrapper.eq("combo_key", comboKey)
                    .set("avg_rating", BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP))
                    .set("feedback_count", count)
                    .set("weight", BigDecimal.valueOf(weight).setScale(4, RoundingMode.HALF_UP));
            comboWeightMapper.update(null, updateWrapper);
            log.info("更新学习权重: {} = {} ({}条反馈)", comboKey, avgRating, count);
        }
        
        invalidateHotCombinationsCache();
    }
    
    private void invalidateHotCombinationsCache() {
        try {
            redisTemplate.delete(HOT_COMBINATIONS_KEY);
        } catch (Exception e) {
            log.warn("清除热门组合缓存失败", e);
        }
    }

    @Override
    public List<ComboWeight> getTopLearnedCombos(int limit) {
        QueryWrapper<ComboWeight> wrapper = new QueryWrapper<>();
        wrapper.orderByDesc("avg_rating")
                .orderByDesc("feedback_count")
                .last("LIMIT " + limit);
        return comboWeightMapper.selectList(wrapper);
    }
}
