package com.balistics.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ballistics_log")
public class BallisticsLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(length = 2000)
    private String logContent;
    
    private String logType;
    
    private String climateCondition;
    
    private Double temperature;
    
    private Double humidity;
    
    private Double pressure;
    
    private Double airDensity;
    
    private Double bulletDrop;
    
    private Double velocityDrop;
    
    private LocalDateTime createTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLogContent() {
        return logContent;
    }

    public void setLogContent(String logContent) {
        this.logContent = logContent;
    }

    public String getLogType() {
        return logType;
    }

    public void setLogType(String logType) {
        this.logType = logType;
    }

    public String getClimateCondition() {
        return climateCondition;
    }

    public void setClimateCondition(String climateCondition) {
        this.climateCondition = climateCondition;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getHumidity() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public Double getPressure() {
        return pressure;
    }

    public void setPressure(Double pressure) {
        this.pressure = pressure;
    }

    public Double getAirDensity() {
        return airDensity;
    }

    public void setAirDensity(Double airDensity) {
        this.airDensity = airDensity;
    }

    public Double getBulletDrop() {
        return bulletDrop;
    }

    public void setBulletDrop(Double bulletDrop) {
        this.bulletDrop = bulletDrop;
    }

    public Double getVelocityDrop() {
        return velocityDrop;
    }

    public void setVelocityDrop(Double velocityDrop) {
        this.velocityDrop = velocityDrop;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
