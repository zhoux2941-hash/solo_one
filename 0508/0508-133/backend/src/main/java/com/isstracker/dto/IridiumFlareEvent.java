package com.isstracker.dto;

import java.time.LocalDateTime;

public class IridiumFlareEvent {
    
    private String eventId;
    private String satelliteName;
    private LocalDateTime flareTime;
    private Double brightness;
    private Double elevation;
    private Double azimuth;
    private String direction;
    private Integer durationSeconds;
    private String flareType;
    private Double latitude;
    private Double longitude;
    private Boolean visible;
    private String eventType;
    private Integer observerCount;

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getSatelliteName() {
        return satelliteName;
    }

    public void setSatelliteName(String satelliteName) {
        this.satelliteName = satelliteName;
    }

    public LocalDateTime getFlareTime() {
        return flareTime;
    }

    public void setFlareTime(LocalDateTime flareTime) {
        this.flareTime = flareTime;
    }

    public Double getBrightness() {
        return brightness;
    }

    public void setBrightness(Double brightness) {
        this.brightness = brightness;
    }

    public Double getElevation() {
        return elevation;
    }

    public void setElevation(Double elevation) {
        this.elevation = elevation;
    }

    public Double getAzimuth() {
        return azimuth;
    }

    public void setAzimuth(Double azimuth) {
        this.azimuth = azimuth;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public String getFlareType() {
        return flareType;
    }

    public void setFlareType(String flareType) {
        this.flareType = flareType;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Boolean getVisible() {
        return visible;
    }

    public void setVisible(Boolean visible) {
        this.visible = visible;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Integer getObserverCount() {
        return observerCount;
    }

    public void setObserverCount(Integer observerCount) {
        this.observerCount = observerCount;
    }
}
