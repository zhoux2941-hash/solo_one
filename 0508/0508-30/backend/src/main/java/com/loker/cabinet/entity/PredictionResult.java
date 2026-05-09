package com.loker.cabinet.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResult implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String cellId;
    private String column;
    private int row;
    private int currentFatigue;
    private double averageDailyIncrement;
    private List<DailyTrend> historyTrends;
    private List<DailyTrend> predictedTrends;
    private boolean willReachDangerThreshold;
    private LocalDate predictedDangerDate;
    private int predictedFatigueAtDanger;
    private String riskLevel;
    private String suggestion;
}
