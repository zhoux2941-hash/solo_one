package com.balistics.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ballistics_result")
public class BallisticsResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "weather_data_id")
    private WeatherData weatherData;
    
    private Double airDensity;
    
    private Double dragCoefficient;
    
    private Double dragForce;
    
    private Double velocityDrop;
    
    private Double bulletDrop;
    
    private Double remainingVelocity;
    
    private Double timeOfFlight;
    
    private Double dragCorrectionFactor;
    
    private String climateType;
    
    private String comparisonResult;
    
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

    public WeatherData getWeatherData() {
        return weatherData;
    }

    public void setWeatherData(WeatherData weatherData) {
        this.weatherData = weatherData;
    }

    public Double getAirDensity() {
        return airDensity;
    }

    public void setAirDensity(Double airDensity) {
        this.airDensity = airDensity;
    }

    public Double getDragCoefficient() {
        return dragCoefficient;
    }

    public void setDragCoefficient(Double dragCoefficient) {
        this.dragCoefficient = dragCoefficient;
    }

    public Double getDragForce() {
        return dragForce;
    }

    public void setDragForce(Double dragForce) {
        this.dragForce = dragForce;
    }

    public Double getVelocityDrop() {
        return velocityDrop;
    }

    public void setVelocityDrop(Double velocityDrop) {
        this.velocityDrop = velocityDrop;
    }

    public Double getBulletDrop() {
        return bulletDrop;
    }

    public void setBulletDrop(Double bulletDrop) {
        this.bulletDrop = bulletDrop;
    }

    public Double getRemainingVelocity() {
        return remainingVelocity;
    }

    public void setRemainingVelocity(Double remainingVelocity) {
        this.remainingVelocity = remainingVelocity;
    }

    public Double getTimeOfFlight() {
        return timeOfFlight;
    }

    public void setTimeOfFlight(Double timeOfFlight) {
        this.timeOfFlight = timeOfFlight;
    }

    public Double getDragCorrectionFactor() {
        return dragCorrectionFactor;
    }

    public void setDragCorrectionFactor(Double dragCorrectionFactor) {
        this.dragCorrectionFactor = dragCorrectionFactor;
    }

    public String getClimateType() {
        return climateType;
    }

    public void setClimateType(String climateType) {
        this.climateType = climateType;
    }

    public String getComparisonResult() {
        return comparisonResult;
    }

    public void setComparisonResult(String comparisonResult) {
        this.comparisonResult = comparisonResult;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
