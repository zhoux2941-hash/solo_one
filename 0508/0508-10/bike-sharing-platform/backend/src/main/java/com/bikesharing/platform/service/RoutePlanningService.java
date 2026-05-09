package com.bikesharing.platform.service;

import com.bikesharing.platform.dto.*;
import com.bikesharing.platform.entity.ParkingPoint;
import com.bikesharing.platform.repository.ParkingPointRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoutePlanningService {

    private final ParkingPointService parkingPointService;
    private final ParkingPointRepository parkingPointRepository;
    private final OsrmService osrmService;

    private static final int MAX_VEHICLE_CAPACITY = 10;
    private static final double OVER_SATURATED_THRESHOLD = 0.8;
    private static final double SHORTAGE_THRESHOLD = 0.2;

    public RoutePlanDTO optimizeRoutes() {
        log.info("Starting route optimization...");
        long startTime = System.currentTimeMillis();

        List<ParkingPointStatusDTO> allPoints = parkingPointService.getAllParkingPointStatus();
        
        List<ParkingPointStatusDTO> surplusPoints = allPoints.stream()
                .filter(p -> p.getStatus().equals("OVER_SATURATED"))
                .sorted((a, b) -> Double.compare(b.getUtilizationRate(), a.getUtilizationRate()))
                .collect(Collectors.toList());
        
        List<ParkingPointStatusDTO> shortagePoints = allPoints.stream()
                .filter(p -> p.getStatus().equals("SHORTAGE"))
                .sorted((a, b) -> Double.compare(a.getUtilizationRate(), b.getUtilizationRate()))
                .collect(Collectors.toList());

        log.info("Surplus points: {}, Shortage points: {}", surplusPoints.size(), shortagePoints.size());

        if (surplusPoints.isEmpty() || shortagePoints.isEmpty()) {
            log.info("No imbalance found, returning empty plan");
            return RoutePlanDTO.builder()
                    .planId(UUID.randomUUID().toString())
                    .steps(new ArrayList<>())
                    .totalDistanceKm(0.0)
                    .totalDurationMinutes(0)
                    .totalBikesMoved(0)
                    .vehiclesUsed(0)
                    .routeCoordinates(new ArrayList<>())
                    .startTime(System.currentTimeMillis())
                    .status("NO_DISPATCH_NEEDED")
                    .build();
        }

        Map<Long, ParkingPoint> pointDetails = parkingPointRepository.findAll().stream()
                .collect(Collectors.toMap(ParkingPoint::getPointId, p -> p));

        Map<Long, Integer> surplus = new HashMap<>();
        for (ParkingPointStatusDTO p : surplusPoints) {
            int extra = p.getCurrentBikes() - (int)(p.getCapacity() * OVER_SATURATED_THRESHOLD);
            if (extra > 0) {
                surplus.put(p.getPointId(), extra);
            }
        }

        Map<Long, Integer> shortage = new HashMap<>();
        for (ParkingPointStatusDTO p : shortagePoints) {
            int needed = (int)(p.getCapacity() * SHORTAGE_THRESHOLD) - p.getCurrentBikes();
            if (needed > 0) {
                shortage.put(p.getPointId(), needed);
            }
        }

        List<RouteStepDTO> allSteps = new ArrayList<>();
        List<double[]> allCoords = new ArrayList<>();
        double totalDistance = 0;
        int totalDuration = 0;
        int totalBikes = 0;

        while (!surplus.isEmpty() && !shortage.isEmpty()) {
            VehicleRoute route = planSingleVehicleRoute(surplus, shortage, pointDetails);
            if (route == null || route.steps.isEmpty()) break;

            for (RouteStepDTO step : route.steps) {
                step.setStepIndex(allSteps.size());
                allSteps.add(step);
                totalBikes += step.getBikeCount();
                
                OsrmService.DistanceResult dist = osrmService.getRouteDistance(
                        step.getFromLatitude(), step.getFromLongitude(),
                        step.getToLatitude(), step.getToLongitude()
                );
                step.setDistanceKm(dist.distanceKm);
                step.setDurationMinutes(dist.durationMinutes);
                totalDistance += dist.distanceKm;
                totalDuration += dist.durationMinutes;
                
                if (allCoords.isEmpty()) {
                    allCoords.addAll(dist.coordinates);
                } else {
                    allCoords.addAll(dist.coordinates.subList(1, dist.coordinates.size()));
                }
            }
        }

        RoutePlanDTO result = RoutePlanDTO.builder()
                .planId(UUID.randomUUID().toString())
                .steps(allSteps)
                .totalDistanceKm(Math.round(totalDistance * 100.0) / 100.0)
                .totalDurationMinutes(totalDuration)
                .totalBikesMoved(totalBikes)
                .vehiclesUsed(calculateVehiclesNeeded(allSteps))
                .routeCoordinates(allCoords)
                .startTime(System.currentTimeMillis())
                .status("OPTIMIZED")
                .build();

        log.info("Route optimization completed in {}ms. Steps: {}, Distance: {}km, Bikes: {}",
                System.currentTimeMillis() - startTime, 
                allSteps.size(), 
                totalDistance,
                totalBikes);

        return result;
    }

    private VehicleRoute planSingleVehicleRoute(Map<Long, Integer> surplus, 
                                                 Map<Long, Integer> shortage,
                                                 Map<Long, ParkingPoint> pointDetails) {
        if (surplus.isEmpty() || shortage.isEmpty()) return null;

        List<RouteStepDTO> steps = new ArrayList<>();
        int currentLoad = 0;
        Long currentPointId = null;

        while (currentLoad < MAX_VEHICLE_CAPACITY && !surplus.isEmpty() && !shortage.isEmpty()) {
            if (currentLoad < MAX_VEHICLE_CAPACITY && !surplus.isEmpty()) {
                Long bestSurplus = findNearestPoint(currentPointId, surplus.keySet(), pointDetails);
                if (bestSurplus == null) break;

                int available = surplus.get(bestSurplus);
                int toPickup = Math.min(available, MAX_VEHICLE_CAPACITY - currentLoad);
                
                ParkingPoint fromPoint = pointDetails.get(bestSurplus);
                Long nextShortage = findNearestPoint(bestSurplus, shortage.keySet(), pointDetails);
                
                if (nextShortage != null) {
                    int needed = shortage.get(nextShortage);
                    int toDeliver = Math.min(toPickup, needed);
                    
                    ParkingPoint toPoint = pointDetails.get(nextShortage);
                    
                    if (currentPointId == null || !currentPointId.equals(bestSurplus)) {
                        if (currentPointId != null) {
                            ParkingPoint prevPoint = pointDetails.get(currentPointId);
                            steps.add(RouteStepDTO.builder()
                                    .fromPointId(currentPointId)
                                    .fromPointName(prevPoint.getName())
                                    .fromLatitude(prevPoint.getLatitude())
                                    .fromLongitude(prevPoint.getLongitude())
                                    .toPointId(bestSurplus)
                                    .toPointName(fromPoint.getName())
                                    .toLatitude(fromPoint.getLatitude())
                                    .toLongitude(fromPoint.getLongitude())
                                    .bikeCount(0)
                                    .action("空车前往取车点")
                                    .build());
                        }
                    }
                    
                    steps.add(RouteStepDTO.builder()
                            .fromPointId(bestSurplus)
                            .fromPointName(fromPoint.getName())
                            .fromLatitude(fromPoint.getLatitude())
                            .fromLongitude(fromPoint.getLongitude())
                            .toPointId(nextShortage)
                            .toPointName(toPoint.getName())
                            .toLatitude(toPoint.getLatitude())
                            .toLongitude(toPoint.getLongitude())
                            .bikeCount(toDeliver)
                            .action(String.format("从%s取%d辆车，送到%s", fromPoint.getName(), toDeliver, toPoint.getName()))
                            .build());

                    surplus.put(bestSurplus, available - toPickup);
                    if (surplus.get(bestSurplus) <= 0) surplus.remove(bestSurplus);

                    shortage.put(nextShortage, needed - toDeliver);
                    if (shortage.get(nextShortage) <= 0) shortage.remove(nextShortage);

                    currentLoad += toDeliver;
                    currentPointId = nextShortage;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        return new VehicleRoute(steps);
    }

    private Long findNearestPoint(Long fromPointId, Set<Long> candidates, 
                                   Map<Long, ParkingPoint> pointDetails) {
        if (fromPointId == null) {
            return candidates.iterator().next();
        }

        ParkingPoint from = pointDetails.get(fromPointId);
        if (from == null) return candidates.iterator().next();

        Long nearest = null;
        double minDistance = Double.MAX_VALUE;

        for (Long candidateId : candidates) {
            ParkingPoint to = pointDetails.get(candidateId);
            if (to == null) continue;

            double dist = calculateHaversine(from.getLatitude(), from.getLongitude(),
                                              to.getLatitude(), to.getLongitude());
            if (dist < minDistance) {
                minDistance = dist;
                nearest = candidateId;
            }
        }

        return nearest;
    }

    private double calculateHaversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private int calculateVehiclesNeeded(List<RouteStepDTO> steps) {
        if (steps.isEmpty()) return 0;
        return (int) Math.ceil((double) steps.stream()
                .filter(s -> s.getBikeCount() > 0)
                .mapToInt(RouteStepDTO::getBikeCount)
                .sum() / MAX_VEHICLE_CAPACITY);
    }

    private static class VehicleRoute {
        final List<RouteStepDTO> steps;
        VehicleRoute(List<RouteStepDTO> steps) {
            this.steps = steps;
        }
    }
}
