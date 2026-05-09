package com.carwash.monitor.dto;

import lombok.Data;

@Data
public class CheckinResponseDTO {
    private Boolean isSuccess;
    private Double plateProbability;
    private Integer pointsEarned;
    private Integer consecutiveDays;
    private String message;
}
