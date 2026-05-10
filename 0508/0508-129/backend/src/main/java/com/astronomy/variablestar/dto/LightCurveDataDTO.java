package com.astronomy.variablestar.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class LightCurveDataDTO {

    private Long starId;
    private String starName;
    private String starType;
    private BigDecimal periodDays;
    private BigDecimal epochJd;
    private List<ObservationPoint> observations;
    private List<ObservationPoint> historicalData;
    private LocalDateTime cachedAt;

    @Data
    public static class ObservationPoint {
        private BigDecimal phase;
        private BigDecimal magnitude;
        private BigDecimal magnitudeError;
        private LocalDateTime observationTime;
        private BigDecimal julianDate;
        private String observer;
    }
}
