package com.ballistic.trajectory.dto;

public class BallisticCalculationRequest {

    private String ammoType;
    private Double muzzleVelocity;
    private Double bulletMass;
    private Double ballisticCoefficient;
    private Double shootDistance;
    private Double scopeHeight;
    private Integer windDirection;
    private Double windSpeed;
    private Double terrainSlope;
    private String shootDirection;
    private Double temperature;
    private Double pressure;
    private Double humidity;
    private Double altitude;

    public String getAmmoType() {
        return ammoType;
    }

    public void setAmmoType(String ammoType) {
        this.ammoType = ammoType;
    }

    public Double getMuzzleVelocity() {
        return muzzleVelocity;
    }

    public void setMuzzleVelocity(Double muzzleVelocity) {
        this.muzzleVelocity = muzzleVelocity;
    }

    public Double getBulletMass() {
        return bulletMass;
    }

    public void setBulletMass(Double bulletMass) {
        this.bulletMass = bulletMass;
    }

    public Double getBallisticCoefficient() {
        return ballisticCoefficient;
    }

    public void setBallisticCoefficient(Double ballisticCoefficient) {
        this.ballisticCoefficient = ballisticCoefficient;
    }

    public Double getShootDistance() {
        return shootDistance;
    }

    public void setShootDistance(Double shootDistance) {
        this.shootDistance = shootDistance;
    }

    public Double getScopeHeight() {
        return scopeHeight;
    }

    public void setScopeHeight(Double scopeHeight) {
        this.scopeHeight = scopeHeight;
    }

    public Integer getWindDirection() {
        return windDirection;
    }

    public void setWindDirection(Integer windDirection) {
        this.windDirection = windDirection;
    }

    public Double getWindSpeed() {
        return windSpeed;
    }

    public void setWindSpeed(Double windSpeed) {
        this.windSpeed = windSpeed;
    }

    public Double getTerrainSlope() {
        return terrainSlope;
    }

    public void setTerrainSlope(Double terrainSlope) {
        this.terrainSlope = terrainSlope;
    }

    public String getShootDirection() {
        return shootDirection;
    }

    public void setShootDirection(String shootDirection) {
        this.shootDirection = shootDirection;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getPressure() {
        return pressure;
    }

    public void setPressure(Double pressure) {
        this.pressure = pressure;
    }

    public Double getHumidity() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public Double getAltitude() {
        return altitude;
    }

    public void setAltitude(Double altitude) {
        this.altitude = altitude;
    }
}
