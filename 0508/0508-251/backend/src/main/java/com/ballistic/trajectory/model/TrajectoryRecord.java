package com.ballistic.trajectory.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "trajectory_records")
public class TrajectoryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "record_type")
    private String recordType;

    @Column(name = "shooter_latitude")
    private Double shooterLatitude;

    @Column(name = "shooter_longitude")
    private Double shooterLongitude;

    @Column(name = "shooter_altitude")
    private Double shooterAltitude;

    @Column(name = "target_latitude")
    private Double targetLatitude;

    @Column(name = "target_longitude")
    private Double targetLongitude;

    @Column(name = "target_altitude")
    private Double targetAltitude;

    @Column(name = "terrain_slope")
    private Double terrainSlope;

    @Column(name = "shoot_direction")
    private String shootDirection;

    @Column(name = "horizontal_distance")
    private Double horizontalDistance;

    @Column(name = "altitude_difference")
    private Double altitudeDifference;

    @Column(name = "straight_distance")
    private Double straightDistance;

    @Column(name = "shoot_angle")
    private Double shootAngle;

    @Column(name = "ammo_type")
    private String ammoType;

    @Column(name = "muzzle_velocity")
    private Double muzzleVelocity;

    @Column(name = "bullet_mass")
    private Double bulletMass;

    @Column(name = "ballistic_coefficient")
    private Double ballisticCoefficient;

    @Column(name = "shoot_distance")
    private Double shootDistance;

    @Column(name = "wind_speed")
    private Double windSpeed;

    @Column(name = "wind_direction")
    private Integer windDirection;

    @Column(name = "flight_time")
    private Double flightTime;

    @Column(name = "drop_amount")
    private Double dropAmount;

    @Column(name = "elevation_adjust_moa")
    private Double elevationAdjustMoa;

    @Column(name = "windage_adjust_moa")
    private Double windageAdjustMoa;

    @Column(name = "remaining_velocity")
    private Double remainingVelocity;

    @Column(name = "remaining_energy")
    private Double remainingEnergy;

    @Column(name = "terrain_type")
    private String terrainType;

    @Column(name = "terrain_factor")
    private Double terrainFactor;

    @Column(name = "total_windage_cm")
    private Double totalWindageCm;

    @Column(name = "notes", length = 1000)
    private String notes;

    public TrajectoryRecord() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getRecordType() {
        return recordType;
    }

    public void setRecordType(String recordType) {
        this.recordType = recordType;
    }

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

    public Double getHorizontalDistance() {
        return horizontalDistance;
    }

    public void setHorizontalDistance(Double horizontalDistance) {
        this.horizontalDistance = horizontalDistance;
    }

    public Double getAltitudeDifference() {
        return altitudeDifference;
    }

    public void setAltitudeDifference(Double altitudeDifference) {
        this.altitudeDifference = altitudeDifference;
    }

    public Double getStraightDistance() {
        return straightDistance;
    }

    public void setStraightDistance(Double straightDistance) {
        this.straightDistance = straightDistance;
    }

    public Double getShootAngle() {
        return shootAngle;
    }

    public void setShootAngle(Double shootAngle) {
        this.shootAngle = shootAngle;
    }

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

    public Double getWindSpeed() {
        return windSpeed;
    }

    public void setWindSpeed(Double windSpeed) {
        this.windSpeed = windSpeed;
    }

    public Integer getWindDirection() {
        return windDirection;
    }

    public void setWindDirection(Integer windDirection) {
        this.windDirection = windDirection;
    }

    public Double getFlightTime() {
        return flightTime;
    }

    public void setFlightTime(Double flightTime) {
        this.flightTime = flightTime;
    }

    public Double getDropAmount() {
        return dropAmount;
    }

    public void setDropAmount(Double dropAmount) {
        this.dropAmount = dropAmount;
    }

    public Double getElevationAdjustMoa() {
        return elevationAdjustMoa;
    }

    public void setElevationAdjustMoa(Double elevationAdjustMoa) {
        this.elevationAdjustMoa = elevationAdjustMoa;
    }

    public Double getWindageAdjustMoa() {
        return windageAdjustMoa;
    }

    public void setWindageAdjustMoa(Double windageAdjustMoa) {
        this.windageAdjustMoa = windageAdjustMoa;
    }

    public Double getRemainingVelocity() {
        return remainingVelocity;
    }

    public void setRemainingVelocity(Double remainingVelocity) {
        this.remainingVelocity = remainingVelocity;
    }

    public Double getRemainingEnergy() {
        return remainingEnergy;
    }

    public void setRemainingEnergy(Double remainingEnergy) {
        this.remainingEnergy = remainingEnergy;
    }

    public String getTerrainType() {
        return terrainType;
    }

    public void setTerrainType(String terrainType) {
        this.terrainType = terrainType;
    }

    public Double getTerrainFactor() {
        return terrainFactor;
    }

    public void setTerrainFactor(Double terrainFactor) {
        this.terrainFactor = terrainFactor;
    }

    public Double getTotalWindageCm() {
        return totalWindageCm;
    }

    public void setTotalWindageCm(Double totalWindageCm) {
        this.totalWindageCm = totalWindageCm;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
