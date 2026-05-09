package com.carwash.monitor.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CheckinTrendDTO {
    private LocalDate date;
    private Boolean isSuccess;
    private Integer pointsEarned;
}
