package com.aquarium.phmonitor.dto;

import java.time.LocalDateTime;

public class PhRecordDto {

    private Double phValue;
    private LocalDateTime recordTime;
    private Boolean isAbnormal;

    public PhRecordDto() {}

    public PhRecordDto(Double phValue, LocalDateTime recordTime, Boolean isAbnormal) {
        this.phValue = phValue;
        this.recordTime = recordTime;
        this.isAbnormal = isAbnormal;
    }

    public Double getPhValue() {
        return phValue;
    }

    public void setPhValue(Double phValue) {
        this.phValue = phValue;
    }

    public LocalDateTime getRecordTime() {
        return recordTime;
    }

    public void setRecordTime(LocalDateTime recordTime) {
        this.recordTime = recordTime;
    }

    public Boolean getIsAbnormal() {
        return isAbnormal;
    }

    public void setIsAbnormal(Boolean isAbnormal) {
        this.isAbnormal = isAbnormal;
    }
}
