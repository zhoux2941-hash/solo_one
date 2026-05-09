package com.restaurant.queue.scheduler;

import com.restaurant.queue.repository.QueueRecordRepository;
import com.restaurant.queue.service.QueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class MealDurationScheduler {

    private final QueueRecordRepository queueRecordRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String AVG_MEAL_DURATION_KEY = "restaurant:%d:avg:meal:duration";
    private static final String AVG_MEAL_DURATION_SMALL_KEY = "restaurant:%d:avg:meal:duration:small";
    private static final String AVG_MEAL_DURATION_MEDIUM_KEY = "restaurant:%d:avg:meal:duration:medium";

    private String getAvgDurationKey(Long restaurantId) {
        return String.format(AVG_MEAL_DURATION_KEY, restaurantId);
    }

    private String getAvgDurationSmallKey(Long restaurantId) {
        return String.format(AVG_MEAL_DURATION_SMALL_KEY, restaurantId);
    }

    private String getAvgDurationMediumKey(Long restaurantId) {
        return String.format(AVG_MEAL_DURATION_MEDIUM_KEY, restaurantId);
    }

    @Scheduled(fixedRate = 300000)
    public void calculateAndCacheAverageMealDuration() {
        log.info("开始按餐厅计算平均用餐时长...");

        try {
            List<Long> allRestaurantIds = queueRecordRepository.findAllRestaurantIds();
            
            if (allRestaurantIds == null || allRestaurantIds.isEmpty()) {
                log.info("数据库中暂无餐厅数据，使用默认餐厅ID进行计算");
                allRestaurantIds = List.of(QueueService.DEFAULT_RESTAURANT_ID);
            }

            log.info("发现 {} 个餐厅需要计算平均用餐时长", allRestaurantIds.size());

            for (Long restaurantId : allRestaurantIds) {
                calculateForRestaurant(restaurantId);
            }

            log.info("所有餐厅的平均用餐时长计算完成并缓存到Redis");
        } catch (Exception e) {
            log.error("计算平均用餐时长失败", e);
        }
    }

    private void calculateForRestaurant(Long restaurantId) {
        log.debug("计算餐厅 {} 的平均用餐时长", restaurantId);

        Double globalAvg = queueRecordRepository.findAverageMealDurationMinutesByRestaurant(restaurantId);
        if (globalAvg != null && globalAvg > 0) {
            redisTemplate.opsForValue().set(getAvgDurationKey(restaurantId), String.valueOf(globalAvg));
            log.info("餐厅 {} 全局平均用餐时长: {} 分钟", restaurantId, globalAvg);
        }

        Double smallTableAvg = queueRecordRepository.findAverageMealDurationForSmallTablesByRestaurant(restaurantId);
        if (smallTableAvg != null && smallTableAvg > 0) {
            redisTemplate.opsForValue().set(getAvgDurationSmallKey(restaurantId), String.valueOf(smallTableAvg));
            log.info("餐厅 {} 2人桌平均用餐时长: {} 分钟", restaurantId, smallTableAvg);
        } else {
            log.debug("餐厅 {} 暂无2人桌历史数据", restaurantId);
        }

        Double mediumTableAvg = queueRecordRepository.findAverageMealDurationForMediumTablesByRestaurant(restaurantId);
        if (mediumTableAvg != null && mediumTableAvg > 0) {
            redisTemplate.opsForValue().set(getAvgDurationMediumKey(restaurantId), String.valueOf(mediumTableAvg));
            log.info("餐厅 {} 4人桌平均用餐时长: {} 分钟", restaurantId, mediumTableAvg);
        } else {
            log.debug("餐厅 {} 暂无4人桌历史数据", restaurantId);
        }
    }
}
