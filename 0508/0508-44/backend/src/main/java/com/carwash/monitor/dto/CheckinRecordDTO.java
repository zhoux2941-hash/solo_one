package com.carwash.monitor.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CheckinRecordDTO {
    private LocalDate checkinDate;
    private Boolean isSuccess;
    private Integer pointsEarned;
    private Double plateProbability;
    private Integer consecutiveDays;
}
