package com.loker.cabinet.service;

import com.loker.cabinet.entity.CabinetCell;
import com.loker.cabinet.entity.DailyTrend;
import com.loker.cabinet.entity.PredictionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class PredictionService {
    
    private static final Logger logger = LoggerFactory.getLogger(PredictionService.class);
    private static final int DANGER_THRESHOLD = 80;
    private static final int HISTORY_DAYS = 7;
    private static final int PREDICTION_DAYS = 3;
    private static final String[] COLUMNS = {"A", "B", "C", "D", "E", "F"};
    private static final int ROWS = 5;
    
    @Autowired
    private CabinetService cabinetService;
    
    @Cacheable(value = "cabinetPrediction", key = "'allPredictions'")
    public List<PredictionResult> getHighFrequencyPredictions() {
        logger.info("计算高频使用格口预测数据...");
        
        List<CabinetCell> currentCells;
        try {
            currentCells = cabinetService.getCellFatigueWithFallback();
        } catch (Exception e) {
            logger.warn("获取当前疲劳度数据失败，使用模拟数据: {}", e.getMessage());
            currentCells = generateMockCurrentData();
        }
        
        List<PredictionResult> predictions = new ArrayList<>();
        Random random = new Random(42);
        
        for (CabinetCell cell : currentCells) {
            PredictionResult prediction = predictCellFatigue(cell, random);
            predictions.add(prediction);
        }
        
        return predictions.stream()
                .sorted(Comparator.comparing(PredictionResult::isWillReachDangerThreshold).reversed()
                        .thenComparing(p -> p.getPredictedDangerDate() == null ? LocalDate.MAX : p.getPredictedDangerDate()))
                .collect(Collectors.toList());
    }
    
    @Cacheable(value = "cabinetPrediction", key = "'dangerCells'")
    public List<PredictionResult> getDangerPredictionCells() {
        return getHighFrequencyPredictions().stream()
                .filter(PredictionResult::isWillReachDangerThreshold)
                .collect(Collectors.toList());
    }
    
    private PredictionResult predictCellFatigue(CabinetCell cell, Random random) {
        LocalDate today = LocalDate.now();
        List<DailyTrend> historyTrends = generateHistoryTrends(cell, today, random);
        double avgIncrement = calculateAverageIncrement(historyTrends);
        List<DailyTrend> predictedTrends = predictFutureTrends(cell, historyTrends, avgIncrement, today);
        
        PredictionResult result = new PredictionResult();
        result.setCellId(cell.getCellId());
        result.setColumn(cell.getColumn());
        result.setRow(cell.getRow());
        result.setCurrentFatigue(cell.getFatigueScore());
        result.setAverageDailyIncrement(avgIncrement);
        result.setHistoryTrends(historyTrends);
        result.setPredictedTrends(predictedTrends);
        
        checkDangerThreshold(result, predictedTrends);
        setRiskLevelAndSuggestion(result);
        
        return result;
    }
    
    private List<DailyTrend> generateHistoryTrends(CabinetCell cell, LocalDate today, Random random) {
        List<DailyTrend> trends = new ArrayList<>();
        int currentFatigue = cell.getFatigueScore();
        
        boolean isCorner = isCorner(cell);
        boolean isEdge = isEdge(cell);
        
        int baseIncrement;
        if (isCorner) {
            baseIncrement = 8 + random.nextInt(5);
        } else if (isEdge) {
            baseIncrement = 4 + random.nextInt(4);
        } else {
            baseIncrement = 1 + random.nextInt(3);
        }
        
        int accumulatedFatigue = currentFatigue;
        for (int i = HISTORY_DAYS - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            int dailyIncrement = baseIncrement + random.nextInt(3) - 1;
            dailyIncrement = Math.max(0, dailyIncrement);
            
            accumulatedFatigue -= dailyIncrement;
            if (accumulatedFatigue < 0) accumulatedFatigue = 0;
            
            if (i == 0) {
                trends.add(new DailyTrend(date, dailyIncrement, currentFatigue));
            } else {
                trends.add(new DailyTrend(date, dailyIncrement, accumulatedFatigue + dailyIncrement));
            }
        }
        
        return trends;
    }
    
    private List<DailyTrend> predictFutureTrends(CabinetCell cell, List<DailyTrend> historyTrends, 
                                                  double avgIncrement, LocalDate today) {
        List<DailyTrend> predictedTrends = new ArrayList<>();
        int lastFatigue = historyTrends.get(historyTrends.size() - 1).getTotalFatigue();
        
        for (int i = 1; i <= PREDICTION_DAYS; i++) {
            LocalDate date = today.plusDays(i);
            int dailyIncrement = (int) Math.round(avgIncrement);
            lastFatigue += dailyIncrement;
            lastFatigue = Math.min(100, lastFatigue);
            
            predictedTrends.add(new DailyTrend(date, dailyIncrement, lastFatigue));
        }
        
        return predictedTrends;
    }
    
    private double calculateAverageIncrement(List<DailyTrend> trends) {
        return trends.stream()
                .mapToInt(DailyTrend::getDailyIncrement)
                .average()
                .orElse(0);
    }
    
    private void checkDangerThreshold(PredictionResult result, List<DailyTrend> predictedTrends) {
        result.setWillReachDangerThreshold(false);
        result.setPredictedDangerDate(null);
        result.setPredictedFatigueAtDanger(0);
        
        for (DailyTrend trend : predictedTrends) {
            if (trend.getTotalFatigue() > DANGER_THRESHOLD) {
                result.setWillReachDangerThreshold(true);
                result.setPredictedDangerDate(trend.getDate());
                result.setPredictedFatigueAtDanger(trend.getTotalFatigue());
                break;
            }
        }
    }
    
    private void setRiskLevelAndSuggestion(PredictionResult result) {
        int current = result.getCurrentFatigue();
        
        if (result.isWillReachDangerThreshold()) {
            result.setRiskLevel("高风险");
            result.setSuggestion("建议尽快安排维护，该格口预计在未来3天内达到危险阈值");
        } else if (current > 70) {
            result.setRiskLevel("中风险");
            result.setSuggestion("当前疲劳度较高，建议关注使用频率");
        } else if (current > 40) {
            result.setRiskLevel("低风险");
            result.setSuggestion("疲劳度正常，继续监控即可");
        } else {
            result.setRiskLevel("无风险");
            result.setSuggestion("状态良好，无需特别关注");
        }
    }
    
    private boolean isCorner(CabinetCell cell) {
        int colIdx = cell.getColumn().charAt(0) - 'A';
        int row = cell.getRow();
        return (colIdx == 0 || colIdx == COLUMNS.length - 1) && (row == 1 || row == ROWS);
    }
    
    private boolean isEdge(CabinetCell cell) {
        int colIdx = cell.getColumn().charAt(0) - 'A';
        int row = cell.getRow();
        return colIdx == 0 || colIdx == COLUMNS.length - 1 || row == 1 || row == ROWS;
    }
    
    private List<CabinetCell> generateMockCurrentData() {
        List<CabinetCell> cells = new ArrayList<>();
        Random random = new Random(42);
        
        for (int colIdx = 0; colIdx < COLUMNS.length; colIdx++) {
            for (int row = 1; row <= ROWS; row++) {
                String column = COLUMNS[colIdx];
                String cellId = column + row;
                
                int score;
                if ((colIdx == 0 || colIdx == COLUMNS.length - 1) && (row == 1 || row == ROWS)) {
                    score = 70 + random.nextInt(11);
                } else if (colIdx == 0 || colIdx == COLUMNS.length - 1 || row == 1 || row == ROWS) {
                    score = 50 + random.nextInt(21);
                } else {
                    score = 10 + random.nextInt(31);
                }
                
                cells.add(new CabinetCell(column, row, cellId, score));
            }
        }
        
        return cells;
    }
}
