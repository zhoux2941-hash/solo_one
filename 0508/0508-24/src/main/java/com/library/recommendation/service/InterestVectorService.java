package com.library.recommendation.service;

import cn.hutool.core.util.StrUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.recommendation.entity.BorrowRecord;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class InterestVectorService {

    private static final String INTEREST_VECTOR_KEY_PREFIX = "interest:vector:";
    private static final long VECTOR_EXPIRE_DAYS = 90;
    private static final double DECAY_RATE = 0.05;
    private static final double BASE_BORROW_CONTRIBUTION = 1.0;

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public InterestVectorService(RedisTemplate<String, Object> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Data
    public static class TagInterest {
        private String tag;
        private double storedWeight;
        private LocalDateTime lastDecayTime;
        private LocalDateTime lastBorrowTime;
        private int borrowCount;

        public TagInterest() {}

        public TagInterest(String tag, double storedWeight, LocalDateTime lastDecayTime, 
                          LocalDateTime lastBorrowTime, int borrowCount) {
            this.tag = tag;
            this.storedWeight = storedWeight;
            this.lastDecayTime = lastDecayTime;
            this.lastBorrowTime = lastBorrowTime;
            this.borrowCount = borrowCount;
        }
    }

    @Data
    public static class InterestVector {
        private Long readerId;
        private Map<String, TagInterest> tagInterests = new HashMap<>();
        private LocalDateTime lastUpdateTime;

        public InterestVector() {}

        public InterestVector(Long readerId) {
            this.readerId = readerId;
            this.lastUpdateTime = LocalDateTime.now();
        }
    }

    public void updateInterestVector(Long readerId, BorrowRecord record) {
        InterestVector vector = getInterestVector(readerId);
        if (vector == null) {
            vector = new InterestVector(readerId);
        }

        LocalDateTime borrowTime = record.getBorrowTime();
        String tags = record.getTags();
        LocalDateTime now = LocalDateTime.now();

        if (StrUtil.isNotBlank(tags)) {
            String[] tagArray = tags.split(",");
            for (String tag : tagArray) {
                tag = tag.trim();
                if (StrUtil.isBlank(tag)) continue;

                TagInterest tagInterest = vector.getTagInterests().get(tag);
                
                if (tagInterest == null) {
                    tagInterest = new TagInterest();
                    tagInterest.setTag(tag);
                    tagInterest.setStoredWeight(0);
                    tagInterest.setLastDecayTime(now);
                    tagInterest.setLastBorrowTime(borrowTime);
                    tagInterest.setBorrowCount(0);
                    vector.getTagInterests().put(tag, tagInterest);
                }

                double decayedWeight = applyDecayToStoredWeight(
                        tagInterest.getStoredWeight(),
                        tagInterest.getLastDecayTime(),
                        now
                );

                double newContribution = calculateBorrowContribution(borrowTime, now);

                tagInterest.setBorrowCount(tagInterest.getBorrowCount() + 1);
                tagInterest.setLastDecayTime(now);
                
                if (borrowTime.isAfter(tagInterest.getLastBorrowTime())) {
                    tagInterest.setLastBorrowTime(borrowTime);
                }

                tagInterest.setStoredWeight(decayedWeight + newContribution);
            }
        }

        vector.setLastUpdateTime(now);
        saveInterestVector(vector);
    }

    private double applyDecayToStoredWeight(double storedWeight, 
                                           LocalDateTime lastDecayTime, 
                                           LocalDateTime now) {
        if (storedWeight <= 0) return 0;
        
        long daysSinceLastDecay = ChronoUnit.DAYS.between(lastDecayTime, now);
        if (daysSinceLastDecay <= 0) return storedWeight;
        
        double decayFactor = Math.exp(-DECAY_RATE * daysSinceLastDecay);
        return storedWeight * decayFactor;
    }

    private double calculateBorrowContribution(LocalDateTime borrowTime, LocalDateTime now) {
        long daysSinceBorrow = ChronoUnit.DAYS.between(borrowTime, now);
        double timeDecay = Math.exp(-DECAY_RATE * daysSinceBorrow);
        return BASE_BORROW_CONTRIBUTION * timeDecay;
    }

    public InterestVector getInterestVector(Long readerId) {
        String key = INTEREST_VECTOR_KEY_PREFIX + readerId;
        Object data = redisTemplate.opsForValue().get(key);
        
        if (data == null) {
            return null;
        }

        try {
            String json = objectMapper.writeValueAsString(data);
            return objectMapper.readValue(json, new TypeReference<InterestVector>() {});
        } catch (JsonProcessingException e) {
            log.error("解析兴趣向量失败", e);
            return null;
        }
    }

    private void saveInterestVector(InterestVector vector) {
        String key = INTEREST_VECTOR_KEY_PREFIX + vector.getReaderId();
        redisTemplate.opsForValue().set(key, vector, VECTOR_EXPIRE_DAYS, TimeUnit.DAYS);
    }

    public List<TagInterest> getCurrentInterestVector(Long readerId) {
        InterestVector vector = getInterestVector(readerId);
        if (vector == null || vector.getTagInterests().isEmpty()) {
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        List<TagInterest> result = new ArrayList<>();

        for (TagInterest storedInterest : vector.getTagInterests().values()) {
            TagInterest currentInterest = new TagInterest();
            currentInterest.setTag(storedInterest.getTag());
            currentInterest.setLastBorrowTime(storedInterest.getLastBorrowTime());
            currentInterest.setBorrowCount(storedInterest.getBorrowCount());
            currentInterest.setLastDecayTime(now);

            double currentWeight = applyDecayToStoredWeight(
                    storedInterest.getStoredWeight(),
                    storedInterest.getLastDecayTime(),
                    now
            );
            
            currentInterest.setStoredWeight(currentWeight);
            result.add(currentInterest);
        }

        return result.stream()
                .sorted((a, b) -> Double.compare(b.getStoredWeight(), a.getStoredWeight()))
                .collect(Collectors.toList());
    }

    public Map<String, Double> getInterestVectorMap(Long readerId) {
        List<TagInterest> interests = getCurrentInterestVector(readerId);
        Map<String, Double> map = new HashMap<>();
        for (TagInterest interest : interests) {
            map.put(interest.getTag(), interest.getStoredWeight());
        }
        return map;
    }

    public void rebuildInterestVector(Long readerId, List<BorrowRecord> records) {
        InterestVector vector = new InterestVector(readerId);

        Map<String, List<BorrowRecord>> tagRecordsMap = new HashMap<>();
        for (BorrowRecord record : records) {
            String tags = record.getTags();
            if (StrUtil.isNotBlank(tags)) {
                String[] tagArray = tags.split(",");
                for (String tag : tagArray) {
                    tag = tag.trim();
                    if (StrUtil.isBlank(tag)) continue;
                    tagRecordsMap.computeIfAbsent(tag, k -> new ArrayList<>()).add(record);
                }
            }
        }

        LocalDateTime now = LocalDateTime.now();
        for (Map.Entry<String, List<BorrowRecord>> entry : tagRecordsMap.entrySet()) {
            String tag = entry.getKey();
            List<BorrowRecord> tagRecords = entry.getValue();

            double totalWeight = 0;
            LocalDateTime lastBorrowTime = null;

            for (BorrowRecord record : tagRecords) {
                if (lastBorrowTime == null || record.getBorrowTime().isAfter(lastBorrowTime)) {
                    lastBorrowTime = record.getBorrowTime();
                }

                totalWeight += calculateBorrowContribution(record.getBorrowTime(), now);
            }

            int borrowCount = tagRecords.size();
            double countBonus = Math.log(borrowCount + 1) * 0.5;
            totalWeight += countBonus;

            TagInterest tagInterest = new TagInterest(
                    tag,
                    totalWeight,
                    now,
                    lastBorrowTime,
                    borrowCount
            );
            vector.getTagInterests().put(tag, tagInterest);
        }

        vector.setLastUpdateTime(now);
        saveInterestVector(vector);
    }

    public void deleteInterestVector(Long readerId) {
        String key = INTEREST_VECTOR_KEY_PREFIX + readerId;
        redisTemplate.delete(key);
    }

    public double getDecayedWeight(double storedWeight, LocalDateTime lastDecayTime) {
        return applyDecayToStoredWeight(storedWeight, lastDecayTime, LocalDateTime.now());
    }
}
