package com.logistics.track.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class DailyTimeAnalysisDTO {
    private LocalDate date;
    private Long totalPackages;
    private Double averageDurationHours;
}
