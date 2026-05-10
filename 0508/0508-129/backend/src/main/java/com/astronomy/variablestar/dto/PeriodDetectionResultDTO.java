package com.astronomy.variablestar.dto;

import lombok.Data;
import java.util.List;

@Data
public class PeriodDetectionResultDTO {

    private boolean success;
    private String message;
    
    private double bestPeriod;
    private double bestFrequency;
    private double bestPower;
    private double falseAlarmProbability;
    private boolean isSignificant;
    
    private List<CandidatePeriod> candidatePeriods;
    private List<PeriodogramPoint> periodogramData;
    
    private int dataPoints;
    private double timeSpan;
    private String starName;
    private Long starId;
    
    private SmoothedLightCurve smoothedLightCurve;

    @Data
    public static class CandidatePeriod {
        private double period;
        private double frequency;
        private double power;
        private String periodType;
        private int rank;
    }

    @Data
    public static class PeriodogramPoint {
        private double frequency;
        private double period;
        private double power;
    }

    @Data
    public static class SmoothedLightCurve {
        private String method;
        private int windowSize;
        private List<Double> phases;
        private List<Double> smoothedMagnitudes;
        private List<Double> originalMagnitudes;
        private List<Double> residuals;
        private double rms;
        private double chiSquare;
    }
}
