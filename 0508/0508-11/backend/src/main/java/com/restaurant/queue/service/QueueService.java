package com.restaurant.queue.service;

import com.restaurant.queue.dto.QueueRequest;
import com.restaurant.queue.dto.QueueResponse;
import com.restaurant.queue.dto.WaitTimePrediction;
import com.restaurant.queue.entity.QueueRecord;
import com.restaurant.queue.repository.QueueRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class QueueService {

    private final QueueRecordRepository queueRecordRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String ACTIVE_QUEUE_KEY = "restaurant:%d:active:queue";
    private static final String AVG_MEAL_DURATION_KEY = "restaurant:%d:avg:meal:duration";
    private static final String AVG_MEAL_DURATION_SMALL_KEY = "restaurant:%d:avg:meal:duration:small";
    private static final String AVG_MEAL_DURATION_MEDIUM_KEY = "restaurant:%d:avg:meal:duration:medium";

    public static final Long DEFAULT_RESTAURANT_ID = 1L;

    @Value("${restaurant.queue.table-config.small.count:5}")
    private int smallTableCount;

    @Value("${restaurant.queue.table-config.small.capacity:2}")
    private int smallTableCapacity;

    @Value("${restaurant.queue.table-config.medium.count:3}")
    private int mediumTableCount;

    @Value("${restaurant.queue.table-config.medium.capacity:4}")
    private int mediumTableCapacity;

    private String getActiveQueueKey(Long restaurantId) {
        return String.format(ACTIVE_QUEUE_KEY, restaurantId);
    }

    private String getAvgDurationKey(Long restaurantId) {
        return String.format(AVG_MEAL_DURATION_KEY, restaurantId);
    }

    private String getAvgDurationSmallKey(Long restaurantId) {
        return String.format(AVG_MEAL_DURATION_SMALL_KEY, restaurantId);
    }

    private String getAvgDurationMediumKey(Long restaurantId) {
        return String.format(AVG_MEAL_DURATION_MEDIUM_KEY, restaurantId);
    }

    public Long getEffectiveRestaurantId(Long requestRestaurantId) {
        return requestRestaurantId != null ? requestRestaurantId : DEFAULT_RESTAURANT_ID;
    }

    @Transactional
    public QueueResponse enqueue(QueueRequest request) {
        Long restaurantId = getEffectiveRestaurantId(request.getRestaurantId());
        
        QueueRecord record = QueueRecord.builder()
                .restaurantId(restaurantId)
                .phoneNumber(request.getPhoneNumber())
                .partySize(request.getPartySize())
                .status(QueueRecord.QueueStatus.WAITING)
                .enqueueTime(LocalDateTime.now())
                .build();

        record = queueRecordRepository.save(record);

        String queueKey = getActiveQueueKey(restaurantId);
        ZSetOperations<String, String> zSetOps = redisTemplate.opsForZSet();
        zSetOps.add(queueKey, String.valueOf(record.getQueueId()), 
                record.getEnqueueTime().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());

        log.info("顾客取号成功: restaurantId={}, queueId={}, partySize={}", 
                restaurantId, record.getQueueId(), request.getPartySize());

        QueueResponse response = QueueResponse.fromEntity(record);
        response.setPosition(getQueuePosition(restaurantId, record.getQueueId()));
        response.setEstimatedWaitMinutes(predictWaitTime(restaurantId, request.getPartySize()).getEstimatedWaitMinutes());

        return response;
    }

    public QueueResponse callNextQueue(Long restaurantId) {
        restaurantId = getEffectiveRestaurantId(restaurantId);
        String queueKey = getActiveQueueKey(restaurantId);
        
        ZSetOperations<String, String> zSetOps = redisTemplate.opsForZSet();
        Set<String> queueIds = zSetOps.range(queueKey, 0, 0);

        if (queueIds == null || queueIds.isEmpty()) {
            throw new RuntimeException("当前没有等待的顾客");
        }

        String queueIdStr = queueIds.iterator().next();
        Long queueId = Long.parseLong(queueIdStr);

        Optional<QueueRecord> recordOpt = queueRecordRepository.findById(queueId);
        if (recordOpt.isEmpty()) {
            zSetOps.remove(queueKey, queueIdStr);
            throw new RuntimeException("排队记录不存在");
        }

        QueueRecord record = recordOpt.get();
        record.setStatus(QueueRecord.QueueStatus.CALLED);
        record.setCallTime(LocalDateTime.now());
        queueRecordRepository.save(record);

        zSetOps.remove(queueKey, queueIdStr);

        log.info("叫号成功: restaurantId={}, queueId={}", restaurantId, queueId);
        return QueueResponse.fromEntity(record);
    }

    @Transactional
    public QueueResponse completeQueue(Long queueId) {
        QueueRecord record = queueRecordRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("排队记录不存在"));

        record.setStatus(QueueRecord.QueueStatus.COMPLETED);
        record.setCompleteTime(LocalDateTime.now());
        queueRecordRepository.save(record);

        log.info("完成就餐: queueId={}", queueId);
        return QueueResponse.fromEntity(record);
    }

    @Transactional
    public QueueResponse skipQueue(Long queueId) {
        QueueRecord record = queueRecordRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("排队记录不存在"));

        record.setStatus(QueueRecord.QueueStatus.SKIPPED);
        record.setCompleteTime(LocalDateTime.now());
        queueRecordRepository.save(record);

        Long restaurantId = record.getRestaurantId();
        String queueKey = getActiveQueueKey(restaurantId);
        ZSetOperations<String, String> zSetOps = redisTemplate.opsForZSet();
        zSetOps.remove(queueKey, String.valueOf(queueId));

        log.info("过号处理: queueId={}", queueId);
        return QueueResponse.fromEntity(record);
    }

    public QueueResponse getQueueStatus(Long queueId) {
        QueueRecord record = queueRecordRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("排队记录不存在"));

        QueueResponse response = QueueResponse.fromEntity(record);
        if (record.getStatus() == QueueRecord.QueueStatus.WAITING) {
            response.setPosition(getQueuePosition(record.getRestaurantId(), queueId));
            response.setEstimatedWaitMinutes(
                    predictWaitTime(record.getRestaurantId(), record.getPartySize()).getEstimatedWaitMinutes());
        }

        return response;
    }

    public List<QueueResponse> getActiveQueues(Long restaurantId) {
        restaurantId = getEffectiveRestaurantId(restaurantId);
        List<QueueRecord.QueueStatus> activeStatuses = Arrays.asList(
                QueueRecord.QueueStatus.WAITING,
                QueueRecord.QueueStatus.CALLED
        );

        List<QueueRecord> records = queueRecordRepository
                .findByRestaurantIdAndStatusInOrderByEnqueueTimeAsc(restaurantId, activeStatuses);

        List<QueueResponse> responses = new ArrayList<>();
        int position = 1;
        for (QueueRecord record : records) {
            QueueResponse response = QueueResponse.fromEntity(record);
            if (record.getStatus() == QueueRecord.QueueStatus.WAITING) {
                response.setPosition(position++);
            }
            responses.add(response);
        }

        return responses;
    }

    public List<QueueResponse> getWaitingQueues(Long restaurantId) {
        restaurantId = getEffectiveRestaurantId(restaurantId);
        List<QueueRecord> records = queueRecordRepository
                .findByRestaurantIdAndStatusOrderByEnqueueTimeAsc(restaurantId, QueueRecord.QueueStatus.WAITING);

        List<QueueResponse> responses = new ArrayList<>();
        int position = 1;
        for (QueueRecord record : records) {
            QueueResponse response = QueueResponse.fromEntity(record);
            response.setPosition(position++);
            response.setEstimatedWaitMinutes(
                    predictWaitTime(restaurantId, record.getPartySize()).getEstimatedWaitMinutes());
            responses.add(response);
        }

        return responses;
    }

    public WaitTimePrediction predictWaitTime(Long restaurantId, Integer partySize) {
        restaurantId = getEffectiveRestaurantId(restaurantId);
        boolean isSmallTable = partySize <= smallTableCapacity;
        int tableCount = isSmallTable ? smallTableCount : mediumTableCount;

        Long activeQueues = isSmallTable ? 
                queueRecordRepository.countActiveSmallQueuesByRestaurant(restaurantId) : 
                queueRecordRepository.countActiveMediumQueuesByRestaurant(restaurantId);

        if (activeQueues == null) activeQueues = 0L;

        String durationKey = isSmallTable ? getAvgDurationSmallKey(restaurantId) : getAvgDurationMediumKey(restaurantId);
        String globalAvgKey = getAvgDurationKey(restaurantId);

        String avgDurationStr = redisTemplate.opsForValue().get(durationKey);
        String globalAvgStr = redisTemplate.opsForValue().get(globalAvgKey);

        double avgMealDuration = 45.0;

        if (avgDurationStr != null) {
            avgMealDuration = Double.parseDouble(avgDurationStr);
            log.debug("从Redis获取餐厅{}的{}人桌平均时长: {}分钟", restaurantId, (isSmallTable ? "2" : "4"), avgMealDuration);
        } else if (globalAvgStr != null) {
            avgMealDuration = Double.parseDouble(globalAvgStr);
            log.debug("从Redis获取餐厅{}的全局平均时长: {}分钟", restaurantId, avgMealDuration);
        } else {
            Double dbAvg;
            if (isSmallTable) {
                dbAvg = queueRecordRepository.findAverageMealDurationForSmallTablesByRestaurant(restaurantId);
            } else {
                dbAvg = queueRecordRepository.findAverageMealDurationForMediumTablesByRestaurant(restaurantId);
            }
            
            if (dbAvg != null && dbAvg > 0) {
                avgMealDuration = dbAvg;
                log.debug("从数据库获取餐厅{}的{}人桌平均时长: {}分钟", restaurantId, (isSmallTable ? "2" : "4"), avgMealDuration);
            } else {
                Double restaurantGlobal = queueRecordRepository.findAverageMealDurationMinutesByRestaurant(restaurantId);
                if (restaurantGlobal != null && restaurantGlobal > 0) {
                    avgMealDuration = restaurantGlobal;
                }
            }
            log.info("餐厅{}无缓存，使用默认平均时长: {}分钟", restaurantId, avgMealDuration);
        }

        int estimatedWait = (int) Math.ceil((double) activeQueues * avgMealDuration / tableCount);

        log.debug("餐厅{}等待时间预测: 排队{}人桌: activeQueues={}, avgDuration={}, tables={}, 预估={}分钟",
                restaurantId, (isSmallTable ? "2" : "4"), activeQueues, avgMealDuration, tableCount, estimatedWait);

        return WaitTimePrediction.builder()
                .estimatedWaitMinutes(estimatedWait)
                .currentQueueLength(activeQueues.intValue())
                .availableTables(tableCount)
                .averageMealDuration(avgMealDuration)
                .build();
    }

    private Integer getQueuePosition(Long restaurantId, Long queueId) {
        String queueKey = getActiveQueueKey(restaurantId);
        ZSetOperations<String, String> zSetOps = redisTemplate.opsForZSet();
        Long rank = zSetOps.rank(queueKey, String.valueOf(queueId));
        return rank != null ? rank.intValue() + 1 : null;
    }

    public int getTotalTableCount() {
        return smallTableCount + mediumTableCount;
    }

    public Map<String, Object> getTableConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("smallTables", smallTableCount);
        config.put("smallTableCapacity", smallTableCapacity);
        config.put("mediumTables", mediumTableCount);
        config.put("mediumTableCapacity", mediumTableCapacity);
        return config;
    }
}
