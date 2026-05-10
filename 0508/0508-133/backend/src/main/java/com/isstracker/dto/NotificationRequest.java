package com.isstracker.dto;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;

public class NotificationRequest {
    
    private String userIdentifier;
    
    @NotNull(message = "纬度不能为空")
    @DecimalMin(value = "-90.0", message = "纬度最小值为-90")
    @DecimalMax(value = "90.0", message = "纬度最大值为90")
    private Double latitude;
    
    @NotNull(message = "经度不能为空")
    @DecimalMin(value = "-180.0", message = "经度最小值为-180")
    @DecimalMax(value = "180.0", message = "经度最大值为180")
    private Double longitude;
    
    private String locationName;
    
    private Boolean notifyIssPass;
    
    private Boolean notifyIridiumFlare;
    
    private Double minBrightness;
    
    private Double minElevation;
    
    private String notificationMethod;
    
    private String notificationTarget;
    
    private Integer advanceNoticeMinutes;
    
    private Boolean isActive;

    public String getUserIdentifier() {
        return userIdentifier;
    }

    public void setUserIdentifier(String userIdentifier) {
        this.userIdentifier = userIdentifier;
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

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public Boolean getNotifyIssPass() {
        return notifyIssPass;
    }

    public void setNotifyIssPass(Boolean notifyIssPass) {
        this.notifyIssPass = notifyIssPass;
    }

    public Boolean getNotifyIridiumFlare() {
        return notifyIridiumFlare;
    }

    public void setNotifyIridiumFlare(Boolean notifyIridiumFlare) {
        this.notifyIridiumFlare = notifyIridiumFlare;
    }

    public Double getMinBrightness() {
        return minBrightness;
    }

    public void setMinBrightness(Double minBrightness) {
        this.minBrightness = minBrightness;
    }

    public Double getMinElevation() {
        return minElevation;
    }

    public void setMinElevation(Double minElevation) {
        this.minElevation = minElevation;
    }

    public String getNotificationMethod() {
        return notificationMethod;
    }

    public void setNotificationMethod(String notificationMethod) {
        this.notificationMethod = notificationMethod;
    }

    public String getNotificationTarget() {
        return notificationTarget;
    }

    public void setNotificationTarget(String notificationTarget) {
        this.notificationTarget = notificationTarget;
    }

    public Integer getAdvanceNoticeMinutes() {
        return advanceNoticeMinutes;
    }

    public void setAdvanceNoticeMinutes(Integer advanceNoticeMinutes) {
        this.advanceNoticeMinutes = advanceNoticeMinutes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
