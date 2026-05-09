package com.farm.silo.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "alarm_history", indexes = {
    @Index(name = "idx_alarm_time", columnList = "alarm_time"),
    @Index(name = "idx_silo_name", columnList = "silo_name")
})
public class AlarmHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alarm_time", nullable = false)
    private LocalDateTime alarmTime;

    @Column(name = "silo_name", nullable = false, length = 10)
    private String siloName;

    @Column(name = "layer_name", nullable = false, length = 20)
    private String layerName;

    @Column(name = "layer_index", nullable = false)
    private Integer layerIndex;

    @Column(name = "silo_index", nullable = false)
    private Integer siloIndex;

    @Column(name = "temperature", nullable = false)
    private Double temperature;

    @Column(name = "threshold", nullable = false)
    private Double threshold;

    @Column(name = "acknowledged", nullable = false)
    private Boolean acknowledged = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public AlarmHistory() {
    }

    public AlarmHistory(LocalDateTime alarmTime, String siloName, String layerName,
                        Integer siloIndex, Integer layerIndex, Double temperature, Double threshold) {
        this.alarmTime = alarmTime;
        this.siloName = siloName;
        this.layerName = layerName;
        this.siloIndex = siloIndex;
        this.layerIndex = layerIndex;
        this.temperature = temperature;
        this.threshold = threshold;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getAlarmTime() {
        return alarmTime;
    }

    public void setAlarmTime(LocalDateTime alarmTime) {
        this.alarmTime = alarmTime;
    }

    public String getSiloName() {
        return siloName;
    }

    public void setSiloName(String siloName) {
        this.siloName = siloName;
    }

    public String getLayerName() {
        return layerName;
    }

    public void setLayerName(String layerName) {
        this.layerName = layerName;
    }

    public Integer getLayerIndex() {
        return layerIndex;
    }

    public void setLayerIndex(Integer layerIndex) {
        this.layerIndex = layerIndex;
    }

    public Integer getSiloIndex() {
        return siloIndex;
    }

    public void setSiloIndex(Integer siloIndex) {
        this.siloIndex = siloIndex;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getThreshold() {
        return threshold;
    }

    public void setThreshold(Double threshold) {
        this.threshold = threshold;
    }

    public Boolean getAcknowledged() {
        return acknowledged;
    }

    public void setAcknowledged(Boolean acknowledged) {
        this.acknowledged = acknowledged;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
