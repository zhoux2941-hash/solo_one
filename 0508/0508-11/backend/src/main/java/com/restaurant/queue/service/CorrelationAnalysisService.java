package com.restaurant.queue.service;

import com.restaurant.queue.repository.OrderRecordRepository;
import com.restaurant.queue.repository.QueueRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class CorrelationAnalysisService {

    private final OrderRecordRepository orderRecordRepository;
    private final QueueRecordRepository queueRecordRepository;

    public Map<String, Object> getWaitTimeVsOrderAnalysis(Long restaurantId, int days) {
        restaurantId = restaurantId != null ? restaurantId : QueueService.DEFAULT_RESTAURANT_ID;
        LocalDateTime startTime = LocalDateTime.now().minus(days, ChronoUnit.DAYS);

        List<Object[]> scatterData = orderRecordRepository.findScatterDataByRestaurant(restaurantId, startTime);
        
        List<Map<String, Object>> scatterPoints = new ArrayList<>();
        List<Double> xValues = new ArrayList<>();
        List<Double> yValues = new ArrayList<>();

        for (Object[] row : scatterData) {
            Integer waitMinutes = (Integer) row[0];
            BigDecimal totalAmount = (BigDecimal) row[1];
            Integer itemCount = (Integer) row[2];

            if (waitMinutes != null && totalAmount != null) {
                Map<String, Object> point = new HashMap<>();
                point.put("waitMinutes", waitMinutes);
                point.put("orderAmount", totalAmount.doubleValue());
                point.put("itemCount", itemCount);
                scatterPoints.add(point);

                xValues.add((double) waitMinutes);
                yValues.add(totalAmount.doubleValue());
            }
        }

        RegressionResult regression = calculateLinearRegression(xValues, yValues);

        Map<String, Object> result = new HashMap<>();
        result.put("restaurantId", restaurantId);
        result.put("periodDays", days);
        result.put("totalSamples", scatterPoints.size());
        result.put("scatterPoints", scatterPoints);
        result.put("regression", Map.of(
                "slope", regression.slope,
                "intercept", regression.intercept,
                "correlationCoefficient", regression.correlationCoefficient,
                "equation", String.format("y = %.4fx + %.2f", regression.slope, regression.intercept),
                "interpretation", interpretCorrelation(regression.correlationCoefficient)
        ));

        return result;
    }

    public Map<String, Object> getWaitTimeGroupStatistics(Long restaurantId, int days) {
        restaurantId = restaurantId != null ? restaurantId : QueueService.DEFAULT_RESTAURANT_ID;
        LocalDateTime startTime = LocalDateTime.now().minus(days, ChronoUnit.DAYS);

        List<Object[]> groupStats = orderRecordRepository.findWaitTimeGroupStats(restaurantId, startTime);

        List<Map<String, Object>> groups = new ArrayList<>();
        for (Object[] row : groupStats) {
            Map<String, Object> group = new HashMap<>();
            group.put("waitGroup", row[0]);
            group.put("orderCount", ((Number) row[1]).longValue());
            group.put("avgAmount", ((Number) row[2]).doubleValue());
            group.put("avgItemCount", ((Number) row[3]).doubleValue());
            groups.add(group);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("restaurantId", restaurantId);
        result.put("periodDays", days);
        result.put("groups", groups);

        return result;
    }

    public Map<String, Object> getHighPriceDishAnalysis(Long restaurantId, int days, int waitThresholdMinutes) {
        restaurantId = restaurantId != null ? restaurantId : QueueService.DEFAULT_RESTAURANT_ID;
        LocalDateTime startTime = LocalDateTime.now().minus(days, ChronoUnit.DAYS);

        List<Object[]> comparison = orderRecordRepository.findHighPriceComparison(
                restaurantId, waitThresholdMinutes, startTime);

        Map<String, Object> longWaitStats = null;
        Map<String, Object> shortWaitStats = null;

        for (Object[] row : comparison) {
            Long highPriceCount = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            Long normalPriceCount = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            String waitType = (String) row[2];

            long total = highPriceCount + normalPriceCount;
            double highPriceRatio = total > 0 ? (double) highPriceCount / total * 100 : 0;

            Map<String, Object> stats = new HashMap<>();
            stats.put("waitType", waitType);
            stats.put("highPriceCount", highPriceCount);
            stats.put("normalPriceCount", normalPriceCount);
            stats.put("totalItems", total);
            stats.put("highPriceRatio", highPriceRatio);

            if ("等待时间长".equals(waitType)) {
                longWaitStats = stats;
            } else {
                shortWaitStats = stats;
            }
        }

        Double ratioDifference = null;
        if (longWaitStats != null && shortWaitStats != null) {
            ratioDifference = (Double) longWaitStats.get("highPriceRatio") - 
                              (Double) shortWaitStats.get("highPriceRatio");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("restaurantId", restaurantId);
        result.put("periodDays", days);
        result.put("waitThreshold", waitThresholdMinutes);
        result.put("longWaitStats", longWaitStats);
        result.put("shortWaitStats", shortWaitStats);
        result.put("ratioDifference", ratioDifference);
        result.put("interpretation", 
                ratioDifference != null && ratioDifference > 0 
                    ? String.format("等待超过%d分钟的顾客，高价菜比例高出 %.1f%%", waitThresholdMinutes, ratioDifference)
                    : "数据不足或无显著差异");

        return result;
    }

    private RegressionResult calculateLinearRegression(List<Double> x, List<Double> y) {
        if (x.size() < 2 || y.size() < 2 || x.size() != y.size()) {
            return new RegressionResult(0, 0, 0);
        }

        int n = x.size();
        
        double sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
        
        for (int i = 0; i < n; i++) {
            double xi = x.get(i);
            double yi = y.get(i);
            sumX += xi;
            sumY += yi;
            sumXY += xi * yi;
            sumXX += xi * xi;
            sumYY += yi * yi;
        }

        double denominator = (n * sumXX - sumX * sumX);
        double slope = denominator != 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
        double intercept = (sumY - slope * sumX) / n;

        double numerator = n * sumXY - sumX * sumY;
        double denom1 = Math.sqrt(n * sumXX - sumX * sumX);
        double denom2 = Math.sqrt(n * sumYY - sumY * sumY);
        double correlation = (denom1 * denom2) != 0 ? numerator / (denom1 * denom2) : 0;

        return new RegressionResult(slope, intercept, correlation);
    }

    private String interpretCorrelation(double r) {
        double absR = Math.abs(r);
        if (absR >= 0.8) {
            return r > 0 ? "强正相关：等待时间越长，订单金额显著增加" : "强负相关：等待时间越长，订单金额显著减少";
        } else if (absR >= 0.5) {
            return r > 0 ? "中等正相关：等待时间越长，订单金额有增加趋势" : "中等负相关：等待时间越长，订单金额有减少趋势";
        } else if (absR >= 0.3) {
            return r > 0 ? "弱正相关：等待时间与订单金额有轻微正向关系" : "弱负相关：等待时间与订单金额有轻微负向关系";
        } else {
            return "几乎无相关：等待时间与订单金额没有明显的线性关系";
        }
    }

    public static class RegressionResult {
        public final double slope;
        public final double intercept;
        public final double correlationCoefficient;

        public RegressionResult(double slope, double intercept, double correlationCoefficient) {
            this.slope = slope;
            this.intercept = intercept;
            this.correlationCoefficient = correlationCoefficient;
        }
    }

    public Map<String, Object> getOverview(Long restaurantId, int days) {
        restaurantId = restaurantId != null ? restaurantId : QueueService.DEFAULT_RESTAURANT_ID;
        LocalDateTime startTime = LocalDateTime.now().minus(days, ChronoUnit.DAYS);

        Long totalOrders = orderRecordRepository.countByRestaurantId(restaurantId);
        Double avgOrderAmount = orderRecordRepository.findAverageOrderAmount(restaurantId);

        Map<String, Object> overview = new HashMap<>();
        overview.put("restaurantId", restaurantId);
        overview.put("totalOrders", totalOrders != null ? totalOrders : 0L);
        overview.put("averageOrderAmount", avgOrderAmount != null ? avgOrderAmount : 0.0);
        overview.put("periodDays", days);

        return overview;
    }
}
