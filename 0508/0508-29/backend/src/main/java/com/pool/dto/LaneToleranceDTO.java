package com.pool.dto;

import java.time.LocalDate;

public class LaneToleranceDTO {
    private String laneName;
    private Integer toleranceValue;
    private String zone;
    private LocalDate recordDate;

    public LaneToleranceDTO() {
    }

    public LaneToleranceDTO(String laneName, Integer toleranceValue, String zone, LocalDate recordDate) {
        this.laneName = laneName;
        this.toleranceValue = toleranceValue;
        this.zone = zone;
        this.recordDate = recordDate;
    }

    public String getLaneName() {
        return laneName;
    }

    public void setLaneName(String laneName) {
        this.laneName = laneName;
    }

    public Integer getToleranceValue() {
        return toleranceValue;
    }

    public void setToleranceValue(Integer toleranceValue) {
        this.toleranceValue = toleranceValue;
    }

    public String getZone() {
        return zone;
    }

    public void setZone(String zone) {
        this.zone = zone;
    }

    public LocalDate getRecordDate() {
        return recordDate;
    }

    public void setRecordDate(LocalDate recordDate) {
        this.recordDate = recordDate;
    }
}
