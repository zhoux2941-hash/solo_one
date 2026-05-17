package com.zoo.monitoring.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long birdId;

    @Transient
    private String birdNo;

    @Transient
    private String species;

    @Transient
    private String cageNo;

    private String alertType;

    private String alertLevel;

    private String description;

    private Boolean isHandled = false;

    private LocalDateTime alertTime;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (alertTime == null) {
            alertTime = LocalDateTime.now();
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

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getAlertLevel() {
        return alertLevel;
    }

    public void setAlertLevel(String alertLevel) {
        this.alertLevel = alertLevel;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsHandled() {
        return isHandled;
    }

    public void setIsHandled(Boolean isHandled) {
        this.isHandled = isHandled;
    }

    public LocalDateTime getAlertTime() {
        return alertTime;
    }

    public void setAlertTime(LocalDateTime alertTime) {
        this.alertTime = alertTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
