package com.astronomy.variablestar.dto;

import lombok.Data;
import java.util.List;

@Data
public class PeriodDetectionRequestDTO {

    private Long starId;
    private String smoothMethod;
    private Integer windowSize;
    private Integer phaseBins;
    private Boolean useCustomPeriod;
    private Double customPeriod;
    private Double customEpoch;
    
    private List<ObservationPoint> observations;

    @Data
    public static class ObservationPoint {
        private Double julianDate;
        private Double magnitude;
        private Double magnitudeError;
        private String observationTime;
    }
}
