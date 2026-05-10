package com.aquarium.phmonitor.dto;

import java.util.List;

public class TankPhData {

    private String tankName;
    private List<PhRecordDto> records;
    private Double abnormalRate;
    private Integer abnormalCount;
    private Integer totalCount;

    public TankPhData() {}

    public TankPhData(String tankName, List<PhRecordDto> records, Double abnormalRate, Integer abnormalCount, Integer totalCount) {
        this.tankName = tankName;
        this.records = records;
        this.abnormalRate = abnormalRate;
        this.abnormalCount = abnormalCount;
        this.totalCount = totalCount;
    }

    public String getTankName() {
        return tankName;
    }

    public void setTankName(String tankName) {
        this.tankName = tankName;
    }

    public List<PhRecordDto> getRecords() {
        return records;
    }

    public void setRecords(List<PhRecordDto> records) {
        this.records = records;
    }

    public Double getAbnormalRate() {
        return abnormalRate;
    }

    public void setAbnormalRate(Double abnormalRate) {
        this.abnormalRate = abnormalRate;
    }

    public Integer getAbnormalCount() {
        return abnormalCount;
    }

    public void setAbnormalCount(Integer abnormalCount) {
        this.abnormalCount = abnormalCount;
    }

    public Integer getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(Integer totalCount) {
        this.totalCount = totalCount;
    }
}
