package com.ballistic.trajectory.dto;

public class SlopeCalculationRequest {

    private Double shooterLatitude;
    private Double shooterLongitude;
    private Double shooterAltitude;
    private Double targetLatitude;
    private Double targetLongitude;
    private Double targetAltitude;
    private Double terrainSlope;
    private String shootDirection;

    public Double getShooterLatitude() {
        return shooterLatitude;
    }

    public void setShooterLatitude(Double shooterLatitude) {
        this.shooterLatitude = shooterLatitude;
    }

    public Double getShooterLongitude() {
        return shooterLongitude;
    }

    public void setShooterLongitude(Double shooterLongitude) {
        this.shooterLongitude = shooterLongitude;
    }

    public Double getShooterAltitude() {
        return shooterAltitude;
    }

    public void setShooterAltitude(Double shooterAltitude) {
        this.shooterAltitude = shooterAltitude;
    }

    public Double getTargetLatitude() {
        return targetLatitude;
    }

    public void setTargetLatitude(Double targetLatitude) {
        this.targetLatitude = targetLatitude;
    }

    public Double getTargetLongitude() {
        return targetLongitude;
    }

    public void setTargetLongitude(Double targetLongitude) {
        this.targetLongitude = targetLongitude;
    }

    public Double getTargetAltitude() {
        return targetAltitude;
    }

    public void setTargetAltitude(Double targetAltitude) {
        this.targetAltitude = targetAltitude;
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
}
