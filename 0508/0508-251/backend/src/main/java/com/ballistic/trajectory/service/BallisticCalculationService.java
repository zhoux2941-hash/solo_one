package com.ballistic.trajectory.service;

import com.ballistic.trajectory.dto.BallisticCalculationRequest;
import com.ballistic.trajectory.dto.CalculationResult;
import com.ballistic.trajectory.dto.SlopeCalculationRequest;
import com.ballistic.trajectory.model.TrajectoryRecord;
import com.ballistic.trajectory.repository.TrajectoryRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class BallisticCalculationService {

    private static final double GRAVITY = 9.81;
    private static final double STANDARD_AIR_DENSITY = 1.225;

    private static final Map<String, AmmoData> AMMO_DATABASE = new HashMap<>();

    static {
        AMMO_DATABASE.put("7.62x51", new AmmoData(835, 10.9, 0.4, 0.295));
        AMMO_DATABASE.put("5.56x45", new AmmoData(945, 4.02, 0.304, 0.29));
        AMMO_DATABASE.put(".338", new AmmoData(880, 16.2, 0.675, 0.27));
        AMMO_DATABASE.put(".50BMG", new AmmoData(850, 42.0, 1.05, 0.25));
    }

    @Autowired
    private TrajectoryRecordRepository recordRepository;

    public CalculationResult calculateSlope(SlopeCalculationRequest request) {
        if (request.getShooterLatitude() == null || request.getShooterLongitude() == null ||
            request.getTargetLatitude() == null || request.getTargetLongitude() == null) {
            return CalculationResult.error("坐标信息不完整");
        }

        double horizontalDistance = calculateHaversineDistance(
            request.getShooterLatitude(), request.getShooterLongitude(),
            request.getTargetLatitude(), request.getTargetLongitude()
        );

        double shooterAlt = request.getShooterAltitude() != null ? request.getShooterAltitude() : 0;
        double targetAlt = request.getTargetAltitude() != null ? request.getTargetAltitude() : 0;
        double altitudeDifference = targetAlt - shooterAlt;

        double straightDistance = Math.sqrt(
            horizontalDistance * horizontalDistance + altitudeDifference * altitudeDifference
        );

        double shootAngle = Math.atan2(altitudeDifference, horizontalDistance) * 180 / Math.PI;

        TrajectoryRecord record = new TrajectoryRecord();
        record.setRecordType("slope");
        record.setShooterLatitude(request.getShooterLatitude());
        record.setShooterLongitude(request.getShooterLongitude());
        record.setShooterAltitude(request.getShooterAltitude());
        record.setTargetLatitude(request.getTargetLatitude());
        record.setTargetLongitude(request.getTargetLongitude());
        record.setTargetAltitude(request.getTargetAltitude());
        record.setTerrainSlope(request.getTerrainSlope());
        record.setShootDirection(request.getShootDirection());
        record.setHorizontalDistance(horizontalDistance);
        record.setAltitudeDifference(altitudeDifference);
        record.setStraightDistance(straightDistance);
        record.setShootAngle(shootAngle);

        recordRepository.save(record);

        return CalculationResult.success()
            .put("horizontalDistance", horizontalDistance)
            .put("altitudeDifference", altitudeDifference)
            .put("straightDistance", straightDistance)
            .put("shootAngle", shootAngle)
            .put("recordId", record.getId());
    }

    public CalculationResult calculateBallistic(BallisticCalculationRequest request) {
        if (request.getShootDistance() == null || request.getShootDistance() <= 0) {
            return CalculationResult.error("请输入有效的射击距离");
        }

        AmmoData ammoData = getAmmoData(request);

        double velocity = ammoData.velocity;
        double mass = ammoData.mass;
        double dragCoefficient = ammoData.dragCoefficient;

        double temperature = request.getTemperature() != null ? request.getTemperature() : 15.0;
        double pressure = request.getPressure() != null ? request.getPressure() : 1013.0;
        double altitude = request.getAltitude() != null ? request.getAltitude() : 0.0;

        double temperatureFactor = (273.15 + 15) / (273.15 + temperature);
        double pressureFactor = pressure / 1013.0;
        double altitudeFactor = Math.exp(-altitude / 8500.0);
        double airDensity = STANDARD_AIR_DENSITY * temperatureFactor * pressureFactor * altitudeFactor;

        double bulletDiameter = 0.00762;
        double bulletArea = Math.PI * Math.pow(bulletDiameter / 2, 2);

        double terrainSlope = request.getTerrainSlope() != null ? request.getTerrainSlope() : 0.0;
        double slopeAngleRad = terrainSlope * Math.PI / 180.0;
        double effectiveDistance = request.getShootDistance() / Math.cos(slopeAngleRad);

        double initialElevation = calculateInitialElevation(velocity, request.getShootDistance());

        BallisticResult result = calculateTrajectory(
            velocity, mass, dragCoefficient, bulletArea, airDensity,
            effectiveDistance, initialElevation,
            request.getWindSpeed() != null ? request.getWindSpeed() : 0,
            request.getWindDirection() != null ? request.getWindDirection() : 0
        );

        double elevationMOA = metersToMOA(result.dropAmount / 100.0, request.getShootDistance());
        double windageMOA = metersToMOA(result.windageAmount / 100.0, request.getShootDistance());

        TrajectoryRecord record = new TrajectoryRecord();
        record.setRecordType("ballistic");
        record.setAmmoType(request.getAmmoType());
        record.setMuzzleVelocity(velocity);
        record.setBulletMass(mass);
        record.setBallisticCoefficient(ammoData.ballisticCoefficient);
        record.setShootDistance(request.getShootDistance());
        record.setWindSpeed(request.getWindSpeed());
        record.setWindDirection(request.getWindDirection());
        record.setTerrainSlope(terrainSlope);
        record.setShootDirection(request.getShootDirection());
        record.setFlightTime(result.flightTime);
        record.setDropAmount(result.dropAmount);
        record.setElevationAdjustMoa(elevationMOA);
        record.setWindageAdjustMoa(windageMOA);
        record.setRemainingVelocity(result.remainingVelocity);
        record.setRemainingEnergy(result.remainingEnergy);

        recordRepository.save(record);

        return CalculationResult.success()
            .put("flightTime", result.flightTime)
            .put("dropAmount", result.dropAmount)
            .put("elevationAdjustMoa", elevationMOA)
            .put("windageAdjustMoa", windageMOA)
            .put("remainingVelocity", result.remainingVelocity)
            .put("remainingEnergy", result.remainingEnergy)
            .put("recordId", record.getId());
    }

    public CalculationResult calculateWindCorrection(Map<String, Object> request) {
        String terrainType = (String) request.getOrDefault("terrainType", "plain");
        Double valleyWidth = request.get("valleyWidth") != null ? 
            ((Number) request.get("valleyWidth")).doubleValue() : 100.0;
        Double valleyDepth = request.get("valleyDepth") != null ? 
            ((Number) request.get("valleyDepth")).doubleValue() : 50.0;
        Double valleyOrientation = request.get("valleyOrientation") != null ? 
            ((Number) request.get("valleyOrientation")).doubleValue() : 0.0;
        Double shootDirectionAngle = request.get("shootDirectionAngle") != null ? 
            ((Number) request.get("shootDirectionAngle")).doubleValue() : 0.0;
        Double mainWindDir = request.get("mainWindDir") != null ? 
            ((Number) request.get("mainWindDir")).doubleValue() : 90.0;
        Double mainWindSpeed = request.get("mainWindSpeed") != null ? 
            ((Number) request.get("mainWindSpeed")).doubleValue() : 5.0;
        Double turbulence = request.get("turbulence") != null ? 
            ((Number) request.get("turbulence")).doubleValue() : 15.0;
        Double shootDistance = request.get("shootDistance") != null ? 
            ((Number) request.get("shootDistance")).doubleValue() : 500.0;

        double velocity = 850.0;
        double flightTime = shootDistance / velocity * 1.2;
        double effectiveWindSpeed = mainWindSpeed;
        double crosswindComponent = 0;
        double windDeflectionAngle = 0;
        double terrainFactor = 1.0;

        switch (terrainType.toLowerCase()) {
            case "valley":
                double aspectRatio = valleyDepth / valleyWidth;
                terrainFactor = 1.0 + aspectRatio * 0.5;

                double windToValleyAngle = normalizeAngle(mainWindDir - valleyOrientation);
                double shootToValleyAngle = normalizeAngle(shootDirectionAngle - valleyOrientation);

                windDeflectionAngle = calculateValleyWindDeflection(windToValleyAngle, aspectRatio);
                double effectiveWindDir = valleyOrientation + windDeflectionAngle;

                double windToShootAngle = normalizeAngle(effectiveWindDir - shootDirectionAngle);
                crosswindComponent = mainWindSpeed * terrainFactor * 
                    Math.sin(Math.toRadians(windToShootAngle));

                double channelingFactor = Math.abs(Math.cos(Math.toRadians(windToValleyAngle)));
                effectiveWindSpeed = mainWindSpeed * (1.0 + channelingFactor * aspectRatio * 0.6);
                break;

            case "ridge":
                terrainFactor = 1.25;
                double ridgeWindAngle = normalizeAngle(mainWindDir - shootDirectionAngle);
                crosswindComponent = mainWindSpeed * terrainFactor * 
                    Math.sin(Math.toRadians(ridgeWindAngle));
                effectiveWindSpeed = mainWindSpeed * terrainFactor;
                break;

            case "slope":
                terrainFactor = 1.1;
                double slopeWindAngle = normalizeAngle(mainWindDir - shootDirectionAngle);
                crosswindComponent = mainWindSpeed * terrainFactor * 
                    Math.sin(Math.toRadians(slopeWindAngle));
                effectiveWindSpeed = mainWindSpeed * terrainFactor;
                break;

            default:
                double plainWindAngle = normalizeAngle(mainWindDir - shootDirectionAngle);
                crosswindComponent = mainWindSpeed * Math.sin(Math.toRadians(plainWindAngle));
                effectiveWindSpeed = mainWindSpeed;
        }

        double actualCrosswind = Math.abs(crosswindComponent);
        double totalWindageCm = actualCrosswind * flightTime * 100 * 0.85;
        double windageMOA = metersToMOA(totalWindageCm / 100.0, shootDistance);
        double estimatedSpread = totalWindageCm * (turbulence / 100.0) * terrainFactor;

        TrajectoryRecord record = new TrajectoryRecord();
        record.setRecordType("wind");
        record.setTerrainType(terrainType);
        record.setTerrainFactor(terrainFactor);
        record.setWindSpeed(mainWindSpeed);
        record.setWindDirection((int) Math.round(mainWindDir));
        record.setShootDistance(shootDistance);
        record.setTotalWindageCm(totalWindageCm);
        record.setWindageAdjustMoa(windageMOA);

        recordRepository.save(record);

        return CalculationResult.success()
            .put("terrainFactor", terrainFactor)
            .put("effectiveWindSpeed", effectiveWindSpeed)
            .put("effectiveCrosswind", actualCrosswind)
            .put("windDeflectionAngle", windDeflectionAngle)
            .put("totalWindageCm", totalWindageCm)
            .put("windageMOA", windageMOA)
            .put("estimatedSpread", estimatedSpread)
            .put("recordId", record.getId());
    }

    private double normalizeAngle(double angle) {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle > 180 ? angle - 360 : angle;
    }

    private double calculateValleyWindDeflection(double windToValleyAngle, double aspectRatio) {
        double angleRad = Math.toRadians(windToValleyAngle);
        double deflectionFactor = aspectRatio * 0.4;
        double deflection = -Math.sin(angleRad) * deflectionFactor * 45;
        return Math.max(-30, Math.min(30, deflection));
    }

    private static final java.util.Map<String, java.util.Map<String, Double>> PENETRATION_DB;
    static {
        PENETRATION_DB = new java.util.HashMap<>();
        
        java.util.Map<String, Double> ammo = new java.util.HashMap<>();
        ammo.put("5.56x45_mass", 4.0);
        ammo.put("5.56x45_diameter", 5.7);
        ammo.put("5.56x45_velocity", 945.0);
        ammo.put("7.62x39_mass", 7.9);
        ammo.put("7.62x39_diameter", 7.92);
        ammo.put("7.62x39_velocity", 710.0);
        ammo.put("7.62x51_mass", 9.5);
        ammo.put("7.62x51_diameter", 7.82);
        ammo.put("7.62x51_velocity", 840.0);
        ammo.put(".338_mass", 16.2);
        ammo.put(".338_diameter", 8.6);
        ammo.put(".338_velocity", 880.0);
        ammo.put("12.7x99_mass", 42.0);
        ammo.put("12.7x99_diameter", 12.7);
        ammo.put("12.7x99_velocity", 850.0);
        
        java.util.Map<String, Double> bulletType = new java.util.HashMap<>();
        bulletType.put("fmj", 1.0);
        bulletType.put("ap", 1.4);
        bulletType.put("hp", 0.7);
        bulletType.put("sp", 0.85);
        
        java.util.Map<String, Double> coverDensity = new java.util.HashMap<>();
        coverDensity.put("leaf", 0.3);
        coverDensity.put("branch", 0.5);
        coverDensity.put("trunk_small", 0.7);
        coverDensity.put("trunk_medium", 0.75);
        coverDensity.put("trunk_large", 0.8);
        coverDensity.put("dirt", 1.5);
        coverDensity.put("wood", 0.6);
        coverDensity.put("steel", 7.8);
        coverDensity.put("concrete", 2.4);
        
        PENETRATION_DB.put("ammo", ammo);
        PENETRATION_DB.put("bulletType", bulletType);
        PENETRATION_DB.put("cover", coverDensity);
    }

    public CalculationResult calculatePenetration(Map<String, Object> request) {
        String ammoType = (String) request.getOrDefault("ammoType", "7.62x51");
        double bulletMass = request.get("bulletMass") != null ? 
            ((Number) request.get("bulletMass")).doubleValue() : 9.5;
        double bulletDiameter = request.get("bulletDiameter") != null ? 
            ((Number) request.get("bulletDiameter")).doubleValue() : 7.82;
        double muzzleVelocity = request.get("muzzleVelocity") != null ? 
            ((Number) request.get("muzzleVelocity")).doubleValue() : 840.0;
        String bulletType = (String) request.getOrDefault("bulletType", "fmj");
        double shootDistance = request.get("shootDistance") != null ? 
            ((Number) request.get("shootDistance")).doubleValue() : 100.0;
        
        double bulletTypeFactor = PENETRATION_DB.get("bulletType").getOrDefault(bulletType, 1.0);
        
        double impactVelocity = calculateVelocityAtDistance(muzzleVelocity, shootDistance, bulletMass, bulletDiameter);
        double massKg = bulletMass / 1000.0;
        double impactEnergy = 0.5 * massKg * impactVelocity * impactVelocity;
        
        @SuppressWarnings("unchecked")
        java.util.List<Map<String, Object>> layers = 
            (java.util.List<Map<String, Object>>) request.getOrDefault("layers", new java.util.ArrayList<>());
        
        java.util.List<Map<String, Object>> penetrationDetails = new java.util.ArrayList<>();
        double currentVelocity = impactVelocity;
        boolean allPenetrated = true;
        int stoppedAtLayer = -1;
        
        for (int i = 0; i < layers.size(); i++) {
            if (stoppedAtLayer >= 0) break;
            
            Map<String, Object> layer = layers.get(i);
            String coverType = (String) layer.getOrDefault("type", "leaf");
            double thickness = ((Number) layer.getOrDefault("thickness", 20.0)).doubleValue();
            int layerCount = ((Number) layer.getOrDefault("count", 1)).intValue();
            
            for (int j = 0; j < layerCount; j++) {
                Map<String, Object> result = calculatePenetrationLayer(
                    currentVelocity, bulletMass, bulletDiameter, bulletTypeFactor, coverType, thickness
                );
                
                result.put("layer", i + 1);
                result.put("subLayer", layerCount > 1 ? String.format("(%d/%d)", j + 1, layerCount) : "");
                penetrationDetails.add(result);
                
                boolean penetrated = (Boolean) result.get("penetrated");
                if (!penetrated) {
                    allPenetrated = false;
                    stoppedAtLayer = i;
                    currentVelocity = 0;
                    break;
                }
                
                currentVelocity = (Double) result.get("exitVelocity");
            }
        }
        
        double remainingEnergy = 0.5 * massKg * currentVelocity * currentVelocity;
        double energyLossPercent = impactEnergy > 0 ? ((impactEnergy - remainingEnergy) / impactEnergy * 100) : 0;
        double velocityLossPercent = impactVelocity > 0 ? ((impactVelocity - currentVelocity) / impactVelocity * 100) : 0;
        
        Map<String, Object> lethality = calculateLethality(currentVelocity, bulletMass);
        
        return CalculationResult.success()
            .put("impactVelocity", impactVelocity)
            .put("impactEnergy", impactEnergy)
            .put("remainingVelocity", currentVelocity)
            .put("remainingEnergy", remainingEnergy)
            .put("energyLossPercent", energyLossPercent)
            .put("velocityLossPercent", velocityLossPercent)
            .put("allPenetrated", allPenetrated)
            .put("lethality", lethality)
            .put("details", penetrationDetails);
    }

    private double calculateVelocityAtDistance(double muzzleVelocity, double distance, double bulletMass, double diameter) {
        double dragCoefficient = 0.295;
        double airDensity = 1.225;
        double crossSection = Math.PI * Math.pow(diameter / 1000.0 / 2.0, 2);
        double massKg = bulletMass / 1000.0;
        
        double decayFactor = (0.5 * airDensity * crossSection * dragCoefficient * distance) / massKg;
        double velocity = muzzleVelocity * Math.exp(-decayFactor);
        
        return Math.max(velocity, 50.0);
    }

    private Map<String, Object> calculatePenetrationLayer(double velocity, double bulletMass, double diameter,
            double bulletTypeFactor, String coverType, double thicknessCm) {
        double massKg = bulletMass / 1000.0;
        double energy = 0.5 * massKg * velocity * velocity;
        
        double coverDensity = PENETRATION_DB.get("cover").getOrDefault(coverType, 0.5);
        
        double thicknessM = thicknessCm / 100.0;
        double sectionalDensity = bulletMass / (diameter * diameter);
        
        double basePenetration = Math.sqrt(energy * sectionalDensity * bulletTypeFactor) / 50.0;
        double penetrationCapacity = basePenetration / coverDensity;
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("coverType", coverType);
        result.put("thickness", thicknessCm);
        result.put("entryVelocity", velocity);
        
        if (thicknessM > penetrationCapacity) {
            double penetrationRatio = thicknessM / penetrationCapacity;
            double remainingEnergyRatio = Math.pow(1 - 1 / penetrationRatio, 2);
            double remainingEnergy = energy * Math.max(0, remainingEnergyRatio);
            double remainingVelocity = Math.sqrt(2 * remainingEnergy / massKg);
            
            result.put("penetrated", false);
            result.put("exitVelocity", remainingVelocity);
            result.put("energyLoss", energy - remainingEnergy);
            result.put("energyLossPercent", 100.0);
            result.put("penetrationDepth", penetrationCapacity * 100);
        } else {
            double thicknessRatio = thicknessM / penetrationCapacity;
            double energyLossFactor = thicknessRatio * (2 - thicknessRatio) * 0.7;
            double remainingEnergy = energy * (1 - energyLossFactor);
            double remainingVelocity = Math.sqrt(2 * Math.max(remainingEnergy, 0) / massKg);
            
            result.put("penetrated", true);
            result.put("exitVelocity", remainingVelocity);
            result.put("energyLoss", energy - remainingEnergy);
            result.put("energyLossPercent", energyLossFactor * 100);
            result.put("penetrationDepth", thicknessCm);
        }
        
        return result;
    }

    private Map<String, Object> calculateLethality(double velocity, double bulletMass) {
        double massKg = bulletMass / 1000.0;
        double energy = 0.5 * massKg * velocity * velocity;
        
        double lethalityThreshold = 78.0;
        double seriousThreshold = 150.0;
        double lethalThreshold = 300.0;
        
        double probability = 0;
        String threatLevel = "无威胁";
        
        if (energy >= lethalThreshold) {
            probability = 95;
            threatLevel = "致命威胁";
        } else if (energy >= seriousThreshold) {
            probability = 70 + (energy - seriousThreshold) / (lethalThreshold - seriousThreshold) * 25;
            threatLevel = "严重威胁";
        } else if (energy >= lethalityThreshold) {
            probability = 30 + (energy - lethalityThreshold) / (seriousThreshold - lethalityThreshold) * 40;
            threatLevel = "轻度威胁";
        } else if (energy >= 40) {
            probability = (energy - 40) / (lethalityThreshold - 40) * 30;
            threatLevel = "微弱威胁";
        }
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("energy", energy);
        result.put("probability", Math.min(probability, 99));
        result.put("threatLevel", threatLevel);
        return result;
    }

    private AmmoData getAmmoData(BallisticCalculationRequest request) {
        if (request.getAmmoType() != null && AMMO_DATABASE.containsKey(request.getAmmoType())) {
            return AMMO_DATABASE.get(request.getAmmoType());
        }

        double velocity = request.getMuzzleVelocity() != null ? request.getMuzzleVelocity() : 850.0;
        double mass = request.getBulletMass() != null ? request.getBulletMass() : 10.9;
        double bc = request.getBallisticCoefficient() != null ? request.getBallisticCoefficient() : 0.4;
        return new AmmoData(velocity, mass, bc, 0.295);
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private double calculateInitialElevation(double velocity, double distance) {
        double time = distance / velocity;
        double drop = 0.5 * GRAVITY * time * time;
        return Math.atan2(drop, distance) * 180 / Math.PI;
    }

    private BallisticResult calculateTrajectory(double velocity, double mass, double dragCoefficient,
                                                 double bulletArea, double airDensity, double distance,
                                                 double elevationAngle, double windSpeed, int windDirection) {
        double angleRad = Math.toRadians(elevationAngle);
        double vx = velocity * Math.cos(angleRad);
        double vy = velocity * Math.sin(angleRad);
        double x = 0, y = 0, z = 0;
        double t = 0;
        double dt = 0.001;

        double windAngleRad = Math.toRadians(windDirection);
        double windX = windSpeed * Math.cos(windAngleRad);
        double windZ = windSpeed * Math.sin(windAngleRad);

        mass = mass / 1000.0;

        while (x < distance) {
            double vRelativeX = vx - windX;
            double vMag = Math.sqrt(vRelativeX * vRelativeX + vy * vy);

            if (vMag > 0) {
                double dragForce = 0.5 * airDensity * vMag * vMag * dragCoefficient * bulletArea;
                double ax = -(dragForce / mass) * (vRelativeX / vMag);
                double ay = -GRAVITY - (dragForce / mass) * (vy / vMag);

                vx += ax * dt;
                vy += ay * dt;
            }

            x += vx * dt;
            y += vy * dt;
            z += windZ * dt * 0.3;
            t += dt;
        }

        double finalVelocity = Math.sqrt(vx * vx + vy * vy);
        double finalEnergy = 0.5 * mass * finalVelocity * finalVelocity;

        BallisticResult result = new BallisticResult();
        result.flightTime = t;
        result.dropAmount = -y * 100;
        result.windageAmount = Math.abs(z) * 100;
        result.remainingVelocity = finalVelocity;
        result.remainingEnergy = finalEnergy;

        return result;
    }

    private double metersToMOA(double meters, double distanceMeters) {
        double inches = meters * 39.3701;
        double yards = distanceMeters * 1.09361;
        return (inches / yards) * 100 / 1.047;
    }

    private static class AmmoData {
        final double velocity;
        final double mass;
        final double ballisticCoefficient;
        final double dragCoefficient;

        AmmoData(double velocity, double mass, double ballisticCoefficient, double dragCoefficient) {
            this.velocity = velocity;
            this.mass = mass;
            this.ballisticCoefficient = ballisticCoefficient;
            this.dragCoefficient = dragCoefficient;
        }
    }

    private static class BallisticResult {
        double flightTime;
        double dropAmount;
        double windageAmount;
        double remainingVelocity;
        double remainingEnergy;
    }
}
