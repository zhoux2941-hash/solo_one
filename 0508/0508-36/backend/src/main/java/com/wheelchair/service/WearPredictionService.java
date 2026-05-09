package com.wheelchair.service;

import com.wheelchair.dto.WearPredictionResponse;
import com.wheelchair.entity.BrakeWearRecord;
import com.wheelchair.repository.BrakeWearRepository;
import com.wheelchair.util.LinearRegression;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WearPredictionService {

    private final BrakeWearRepository wearRepository;

    private static final int HISTORY_DAYS = 30;
    private static final int PREDICTION_DAYS = 7;
    private static final LocalDate TODAY = LocalDate.of(2026, 5, 9);

    @Cacheable(value = "wearPrediction", key = "#wheelchairId", unless = "#result == null")
    public WearPredictionResponse predictWear(String wheelchairId) {
        log.info("为轮椅 {} 生成磨损预测", wheelchairId);

        LocalDate startDate = TODAY.minusDays(HISTORY_DAYS - 1);
        LocalDate endDate = TODAY;

        List<BrakeWearRecord> records = wearRepository
                .findByWheelchairIdAndRecordDateBetweenOrderByRecordDateDesc(
                        wheelchairId, startDate, endDate);

        if (records.isEmpty()) {
            log.warn("轮椅 {} 没有历史数据", wheelchairId);
            return createEmptyResponse(wheelchairId);
        }

        records.sort(Comparator.comparing(BrakeWearRecord::getRecordDate));

        List<Double> x = new ArrayList<>();
        List<Double> y = new ArrayList<>();
        List<WearPredictionResponse.HistoricalData> historicalData = new ArrayList<>();

        for (int i = 0; i < records.size(); i++) {
            BrakeWearRecord record = records.get(i);
            x.add((double) i);
            y.add((double) record.getWearValue());
            historicalData.add(new WearPredictionResponse.HistoricalData(
                    record.getRecordDate(),
                    record.getWearValue()
            ));
        }

        LinearRegression regression = new LinearRegression(x, y);

        List<WearPredictionResponse.PredictionData> predictions = new ArrayList<>();
        double lastHistoricalValue = y.get(y.size() - 1);
        
        double stdDev = calculateStandardDeviation(y, regression);
        double marginOfError = 1.96 * stdDev;

        for (int i = 1; i <= PREDICTION_DAYS; i++) {
            double futureX = x.size() + i - 1;
            double predicted = regression.predict(futureX);
            
            predicted = Math.max(0, Math.min(100, predicted));
            
            LocalDate predictionDate = TODAY.plusDays(i);
            double lowerBound = Math.max(0, predicted - marginOfError);
            double upperBound = Math.min(100, predicted + marginOfError);

            predictions.add(new WearPredictionResponse.PredictionData(
                    predictionDate,
                    Math.round(predicted * 100.0) / 100.0,
                    Math.round(lowerBound * 100.0) / 100.0,
                    Math.round(upperBound * 100.0) / 100.0
            ));
        }

        WearPredictionResponse.RegressionMetrics metrics = new WearPredictionResponse.RegressionMetrics(
                Math.round(regression.getSlope() * 100.0) / 100.0,
                Math.round(regression.getIntercept() * 100.0) / 100.0,
                Math.round(regression.getR2() * 100.0) / 100.0,
                Math.round(regression.getSlope() * 100.0) / 100.0
        );

        return new WearPredictionResponse(
                wheelchairId,
                historicalData,
                predictions,
                metrics,
                TODAY
        );
    }

    private double calculateStandardDeviation(List<Double> y, LinearRegression regression) {
        if (y.size() < 3) return 2.0;

        double sumSquaredErrors = 0.0;
        for (int i = 0; i < y.size(); i++) {
            double predicted = regression.predict(i);
            sumSquaredErrors += Math.pow(y.get(i) - predicted, 2);
        }
        
        double mse = sumSquaredErrors / (y.size() - 2);
        return Math.sqrt(mse);
    }

    private WearPredictionResponse createEmptyResponse(String wheelchairId) {
        return new WearPredictionResponse(
                wheelchairId,
                new ArrayList<>(),
                new ArrayList<>(),
                new WearPredictionResponse.RegressionMetrics(0.0, 0.0, 0.0, 0.0),
                TODAY
        );
    }
}
