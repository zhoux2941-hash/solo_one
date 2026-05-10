package com.isstracker.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_subscriptions")
public class NotificationSubscription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_identifier", nullable = false, length = 255)
    private String userIdentifier;
    
    @Column(name = "latitude", nullable = false)
    private Double latitude;
    
    @Column(name = "longitude", nullable = false)
    private Double longitude;
    
    @Column(name = "location_name", length = 100)
    private String locationName;
    
    @Column(name = "notify_iss_pass", nullable = false)
    private Boolean notifyIssPass;
    
    @Column(name = "notify_iridium_flare", nullable = false)
    private Boolean notifyIridiumFlare;
    
    @Column(name = "min_brightness")
    private Double minBrightness;
    
    @Column(name = "min_elevation")
    private Double minElevation;
    
    @Column(name = "notification_method", length = 50)
    private String notificationMethod;
    
    @Column(name = "notification_target", length = 255)
    private String notificationTarget;
    
    @Column(name = "advance_notice_minutes")
    private Integer advanceNoticeMinutes;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
        if (notifyIssPass == null) {
            notifyIssPass = false;
        }
        if (notifyIridiumFlare == null) {
            notifyIridiumFlare = false;
        }
        if (minBrightness == null) {
            minBrightness = -3.0;
        }
        if (minElevation == null) {
            minElevation = 10.0;
        }
        if (advanceNoticeMinutes == null) {
            advanceNoticeMinutes = 15;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
