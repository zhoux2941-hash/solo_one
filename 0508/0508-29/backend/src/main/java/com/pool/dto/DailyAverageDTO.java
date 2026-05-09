package com.pool.dto;

import java.time.LocalDate;

public class DailyAverageDTO {
    private LocalDate recordDate;
    private Double averageTolerance;

    public DailyAverageDTO() {
    }

    public DailyAverageDTO(LocalDate recordDate, Double averageTolerance) {
        this.recordDate = recordDate;
        this.averageTolerance = averageTolerance;
    }

    public LocalDate getRecordDate() {
        return recordDate;
    }

    public void setRecordDate(LocalDate recordDate) {
        this.recordDate = recordDate;
    }

    public Double getAverageTolerance() {
        return averageTolerance;
    }

    public void setAverageTolerance(Double averageTolerance) {
        this.averageTolerance = averageTolerance;
    }
}
