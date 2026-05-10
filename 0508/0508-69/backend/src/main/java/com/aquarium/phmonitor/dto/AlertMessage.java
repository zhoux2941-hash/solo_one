package com.aquarium.phmonitor.dto;

import java.time.LocalDateTime;

public class AlertMessage {

    private String tankName;
    private Double currentPh;
    private Double phMin;
    private Double phMax;
    private String alertType;
    private String suggestion;
    private LocalDateTime timestamp;
    private String level;

    public AlertMessage() {}

    public AlertMessage(String tankName, Double currentPh, Double phMin, Double phMax, 
                        String alertType, String suggestion, LocalDateTime timestamp, String level) {
        this.tankName = tankName;
        this.currentPh = currentPh;
        this.phMin = phMin;
        this.phMax = phMax;
        this.alertType = alertType;
        this.suggestion = suggestion;
        this.timestamp = timestamp;
        this.level = level;
    }

    public String getTankName() {
        return tankName;
    }

    public void setTankName(String tankName) {
        this.tankName = tankName;
    }

    public Double getCurrentPh() {
        return currentPh;
    }

    public void setCurrentPh(Double currentPh) {
        this.currentPh = currentPh;
    }

    public Double getPhMin() {
        return phMin;
    }

    public void setPhMin(Double phMin) {
        this.phMin = phMin;
    }

    public Double getPhMax() {
        return phMax;
    }

    public void setPhMax(Double phMax) {
        this.phMax = phMax;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(String suggestion) {
        this.suggestion = suggestion;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }
}
