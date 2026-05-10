package com.astronomy.variablestar.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ObservationResponseDTO {

    private Long id;
    private Long variableStarId;
    private String starName;
    private String observerName;
    private LocalDateTime observationTime;
    private BigDecimal estimatedMagnitude;
    private BigDecimal magnitudeError;
    private BigDecimal phase;
    private BigDecimal julianDate;
    private String observationMethod;
    private String instrument;
    private String skyConditions;
    private String notes;
    private LocalDateTime createdAt;

    private String referenceStarAName;
    private BigDecimal referenceStarAMagnitude;
    private BigDecimal comparisonA;

    private String referenceStarBName;
    private BigDecimal referenceStarBMagnitude;
    private BigDecimal comparisonB;

    private BigDecimal estimateFromA;
    private BigDecimal estimateFromB;
    private BigDecimal estimateDifference;
    private String consistencyLevel;
    private String consistencyDescription;
    private String warningMessage;
    private String suggestion;
}
