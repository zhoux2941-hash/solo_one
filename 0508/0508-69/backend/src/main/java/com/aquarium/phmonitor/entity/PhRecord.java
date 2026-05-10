package com.aquarium.phmonitor.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ph_records", indexes = {
    @Index(name = "idx_tank_name", columnList = "tank_name"),
    @Index(name = "idx_record_time", columnList = "record_time")
})
public class PhRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tank_name", nullable = false, length = 50)
    private String tankName;

    @Column(name = "ph_value", nullable = false)
    private Double phValue;

    @Column(name = "record_time", nullable = false)
    private LocalDateTime recordTime;

    @Column(name = "is_abnormal", nullable = false)
    private Boolean isAbnormal;

    public PhRecord() {}

    public PhRecord(String tankName, Double phValue, LocalDateTime recordTime, Boolean isAbnormal) {
        this.tankName = tankName;
        this.phValue = phValue;
        this.recordTime = recordTime;
        this.isAbnormal = isAbnormal;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTankName() {
        return tankName;
    }

    public void setTankName(String tankName) {
        this.tankName = tankName;
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
