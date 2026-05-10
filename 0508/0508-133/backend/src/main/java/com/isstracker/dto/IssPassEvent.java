package com.isstracker.dto;

import java.time.LocalDateTime;

public class IssPassEvent {
    
    private String eventId;
    private LocalDateTime riseTime;
    private LocalDateTime setTime;
    private LocalDateTime maxElevationTime;
    private Double maxElevation;
    private Double riseAzimuth;
    private Double setAzimuth;
    private Double maxAzimuth;
    private String riseDirection;
    private String setDirection;
    private String maxDirection;
    private Double brightness;
    private Boolean visible;
    private Integer observerCount;

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public LocalDateTime getRiseTime() {
        return riseTime;
    }

    public void setRiseTime(LocalDateTime riseTime) {
        this.riseTime = riseTime;
    }

    public LocalDateTime getSetTime() {
        return setTime;
    }

    public void setSetTime(LocalDateTime setTime) {
        this.setTime = setTime;
    }

    public LocalDateTime getMaxElevationTime() {
        return maxElevationTime;
    }

    public void setMaxElevationTime(LocalDateTime maxElevationTime) {
        this.maxElevationTime = maxElevationTime;
    }

    public Double getMaxElevation() {
        return maxElevation;
    }

    public void setMaxElevation(Double maxElevation) {
        this.maxElevation = maxElevation;
    }

    public Double getRiseAzimuth() {
        return riseAzimuth;
    }

    public void setRiseAzimuth(Double riseAzimuth) {
        this.riseAzimuth = riseAzimuth;
    }

    public Double getSetAzimuth() {
        return setAzimuth;
    }

    public void setSetAzimuth(Double setAzimuth) {
        this.setAzimuth = setAzimuth;
    }

    public Double getMaxAzimuth() {
        return maxAzimuth;
    }

    public void setMaxAzimuth(Double maxAzimuth) {
        this.maxAzimuth = maxAzimuth;
    }

    public String getRiseDirection() {
        return riseDirection;
    }

    public void setRiseDirection(String riseDirection) {
        this.riseDirection = riseDirection;
    }

    public String getSetDirection() {
        return setDirection;
    }

    public void setSetDirection(String setDirection) {
        this.setDirection = setDirection;
    }

    public String getMaxDirection() {
        return maxDirection;
    }

    public void setMaxDirection(String maxDirection) {
        this.maxDirection = maxDirection;
    }

    public Double getBrightness() {
        return brightness;
    }

    public void setBrightness(Double brightness) {
        this.brightness = brightness;
    }

    public Boolean getVisible() {
        return visible;
    }

    public void setVisible(Boolean visible) {
        this.visible = visible;
    }

    public Integer getObserverCount() {
        return observerCount;
    }

    public void setObserverCount(Integer observerCount) {
        this.observerCount = observerCount;
    }
}
