package com.canteen.service;

import com.canteen.dto.DailySummaryDTO;
import com.canteen.dto.EventDTO;
import com.canteen.dto.PredictionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
public class PredictionService {

    private static final Logger logger = LoggerFactory.getLogger(PredictionService.class);

    @Autowired
    private FoodWasteService foodWasteService;

    @Autowired
    private EventService eventService;

    @Cacheable(value = "prediction", key = "T(java.lang.String).format('%.2f_%d', #alpha, #predictionDays)")
    public List<PredictionDTO> predict(double alpha, int predictionDays) {
        logger.info("执行预测计算: alpha={}", alpha);
        
        List<DailySummaryDTO> historicalData = foodWasteService.getRecentData(30);
        Map<LocalDate, List<EventDTO>> eventsMap = eventService.getEventsMap(60);
        
        if (historicalData.isEmpty()) {
            logger.warn("历史数据为空，无法预测");
            return Collections.emptyList();
        }
        
        logger.info("历史数据数量: {} 天, 事件数量: {} 天有事件", 
                historicalData.size(), eventsMap.size());

        List<Double> adjustedLunchData = new ArrayList<>();
        List<Double> adjustedDinnerData = new ArrayList<>();
        
        for (DailySummaryDTO dto : historicalData) {
            LocalDate date = dto.getDate();
            double eventFactor = getEventFactorForDate(eventsMap, date);
            
            double originalLunch = dto.getLunch().doubleValue();
            double originalDinner = dto.getDinner().doubleValue();
            
            double adjustedLunch = originalLunch / eventFactor;
            double adjustedDinner = originalDinner / eventFactor;
            
            adjustedLunchData.add(adjustedLunch);
            adjustedDinnerData.add(adjustedDinner);
            
            if (eventFactor != 1.0) {
                logger.debug("日期 {} 有事件，因子={}: 午餐 {} -> {}, 晚餐 {} -> {}", 
                        date, eventFactor, originalLunch, adjustedLunch, originalDinner, adjustedDinner);
            }
        }

        double baseLunchForecast = simpleExponentialSmoothing(adjustedLunchData, alpha);
        double baseDinnerForecast = simpleExponentialSmoothing(adjustedDinnerData, alpha);
        
        logger.info("基准预测(去除事件影响): alpha={}, 午餐={}, 晚餐={}", 
                alpha, baseLunchForecast, baseDinnerForecast);

        List<PredictionDTO> predictions = new ArrayList<>();
        LocalDate lastDate = historicalData.get(historicalData.size() - 1).getDate();

        for (int i = 1; i <= predictionDays; i++) {
            LocalDate forecastDate = lastDate.plusDays(i);
            double weekendFactor = getWeekendFactor(forecastDate);
            double eventFactor = getEventFactorForDate(eventsMap, forecastDate);
            
            double totalFactor = weekendFactor * eventFactor;
            
            double lunchValue = baseLunchForecast * totalFactor;
            double dinnerValue = baseDinnerForecast * totalFactor;
            
            BigDecimal lunchPred = BigDecimal.valueOf(lunchValue).setScale(2, RoundingMode.HALF_UP);
            BigDecimal dinnerPred = BigDecimal.valueOf(dinnerValue).setScale(2, RoundingMode.HALF_UP);

            predictions.add(PredictionDTO.builder()
                    .date(forecastDate)
                    .lunch(lunchPred)
                    .dinner(dinnerPred)
                    .total(lunchPred.add(dinnerPred))
                    .build());
            
            logger.debug("预测日期 {}: 周末因子={}, 事件因子={}, 午餐={}, 晚餐={}", 
                    forecastDate, weekendFactor, eventFactor, lunchPred, dinnerPred);
        }
        
        logger.info("预测结果: alpha={}, 第一个预测日期={}, 午餐={}, 晚餐={}, 总计={}", 
                alpha, predictions.get(0).getDate(), 
                predictions.get(0).getLunch(), predictions.get(0).getDinner(), predictions.get(0).getTotal());

        return predictions;
    }

    private double getEventFactorForDate(Map<LocalDate, List<EventDTO>> eventsMap, LocalDate date) {
        List<EventDTO> events = eventsMap.get(date);
        if (events == null || events.isEmpty()) {
            return 1.0;
        }
        
        double totalFactor = 1.0;
        for (EventDTO event : events) {
            Double factor = event.getImpactFactor();
            if (factor != null && factor > 0) {
                totalFactor *= factor;
            }
        }
        return totalFactor;
    }

    private double simpleExponentialSmoothing(List<Double> data, double alpha) {
        if (data.isEmpty()) {
            return 0.0;
        }
        
        double level = data.get(0);
        logger.debug("初始预测值: {}", level);
        
        for (int i = 1; i < data.size(); i++) {
            double oldLevel = level;
            level = alpha * data.get(i) + (1 - alpha) * level;
            if (i == data.size() - 1 || i % 10 == 0) {
                logger.debug("迭代 i={}: 调整后值={}, 旧平滑值={}, 新平滑值={}", 
                        i, data.get(i), oldLevel, level);
            }
        }
        
        return level;
    }

    private double getWeekendFactor(LocalDate date) {
        int dayOfWeek = date.getDayOfWeek().getValue();
        if (dayOfWeek >= 6) {
            return 0.45;
        }
        return 1.0;
    }
}
