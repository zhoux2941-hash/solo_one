package com.zoo.monitoring.entity;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "monitoring_data")
public class MonitoringData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "鸟类ID不能为空")
    private Long birdId;

    @Transient
    private String birdNo;

    @Transient
    private String species;

    @Transient
    private String cageNo;

    @NotNull(message = "体温不能为空")
    private Double temperature;

    private Boolean pcrPositive = false;

    private Integer wildBirdCount;

    private String notes;

    private LocalDateTime monitorTime;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (monitorTime == null) {
            monitorTime = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBirdId() {
        return birdId;
    }

    public void setBirdId(Long birdId) {
        this.birdId = birdId;
    }

    public String getBirdNo() {
        return birdNo;
    }

    public void setBirdNo(String birdNo) {
        this.birdNo = birdNo;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getCageNo() {
        return cageNo;
    }

    public void setCageNo(String cageNo) {
        this.cageNo = cageNo;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Boolean getPcrPositive() {
        return pcrPositive;
    }

    public void setPcrPositive(Boolean pcrPositive) {
        this.pcrPositive = pcrPositive;
    }

    public Integer getWildBirdCount() {
        return wildBirdCount;
    }

    public void setWildBirdCount(Integer wildBirdCount) {
        this.wildBirdCount = wildBirdCount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getMonitorTime() {
        return monitorTime;
    }

    public void setMonitorTime(LocalDateTime monitorTime) {
        this.monitorTime = monitorTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
