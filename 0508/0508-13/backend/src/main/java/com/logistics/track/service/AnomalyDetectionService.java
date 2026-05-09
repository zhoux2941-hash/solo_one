package com.logistics.track.service;

import com.logistics.track.dto.*;
import com.logistics.track.entity.Package;
import com.logistics.track.entity.Track;
import com.logistics.track.entity.TrackStatus;
import com.logistics.track.repository.PackageRepository;
import com.logistics.track.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnomalyDetectionService {

    private final PackageRepository packageRepository;
    private final TrackRepository trackRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String ROUTE_STATS_CACHE = "anomaly:route_stats";
    private static final String ANOMALIES_CACHE = "anomaly:list";
    private static final double Z_SCORE_THRESHOLD = 2.0;
    private static final int MIN_SAMPLE_SIZE = 3;

    public AnomalyDetectionResultDTO detectAnomalies() {
        log.info("开始执行异常检测");
        
        List<Package> allPackages = packageRepository.findAll();
        List<Package> completedPackages = allPackages.stream()
                .filter(p -> p.getCurrentStatus() == TrackStatus.SIGNED)
                .collect(Collectors.toList());
        
        Map<String, RouteStats> routeStatsMap = calculateRouteStatistics(completedPackages);
        
        Map<String, RouteStatisticsDTO> routeStatsDTOs = routeStatsMap.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> convertToRouteStatsDTO(entry.getKey(), entry.getValue())
                ));
        
        cacheRouteStatistics(new ArrayList<>(routeStatsDTOs.values()));
        
        List<Package> inTransitPackages = allPackages.stream()
                .filter(p -> p.getCurrentStatus() != TrackStatus.SIGNED)
                .collect(Collectors.toList());
        
        List<AnomalyPackageDTO> anomalies = new ArrayList<>();
        
        for (Package pkg : inTransitPackages) {
            String routeKey = pkg.getSenderCity() + "|" + pkg.getReceiverCity();
            RouteStatisticsDTO routeStats = routeStatsDTOs.get(routeKey);
            
            if (routeStats == null || routeStats.getTotalPackages() < MIN_SAMPLE_SIZE) {
                continue;
            }
            
            List<Track> packageTracks = trackRepository.findByPackageIdOrderByTimestampAsc(pkg.getPackageId());
            if (packageTracks.isEmpty()) {
                continue;
            }
            
            Optional<Track> pickupTrack = packageTracks.stream()
                    .filter(t -> t.getStatus() == TrackStatus.PICKUP)
                    .findFirst();
            
            if (pickupTrack.isEmpty()) {
                continue;
            }
            
            LocalDateTime pickupTime = pickupTrack.get().getTimestamp();
            LocalDateTime now = LocalDateTime.now();
            long currentDuration = Duration.between(pickupTime, now).toHours();
            
            double zScore = (currentDuration - routeStats.getMeanDurationHours()) / routeStats.getStandardDeviation();
            
            if (zScore > Z_SCORE_THRESHOLD) {
                AnomalyPackageDTO anomaly = buildAnomalyPackage(
                        pkg, packageTracks, routeStats, currentDuration, zScore
                );
                anomalies.add(anomaly);
            }
        }
        
        anomalies.sort((a, b) -> Double.compare(b.getZScore(), a.getZScore()));
        
        AnomalyDetectionResultDTO result = new AnomalyDetectionResultDTO();
        result.setTotalPackages(allPackages.size());
        result.setAnomalyCount(anomalies.size());
        result.setAnomalyRate(allPackages.isEmpty() ? 0.0 : 
            Math.round((double) anomalies.size() / allPackages.size() * 10000.0) / 100.0);
        result.setAnomalies(anomalies);
        result.setRouteStatistics(new ArrayList<>(routeStatsDTOs.values()));
        result.setAnalyzedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        
        cacheAnomalies(anomalies);
        
        log.info("异常检测完成: 总包裹={}, 异常包裹={}, 异常率={}%", 
                result.getTotalPackages(), result.getAnomalyCount(), result.getAnomalyRate());
        
        return result;
    }

    private Map<String, RouteStats> calculateRouteStatistics(List<Package> completedPackages) {
        Map<String, List<Long>> durationsByRoute = new HashMap<>();
        
        for (Package pkg : completedPackages) {
            String routeKey = pkg.getSenderCity() + "|" + pkg.getReceiverCity();
            
            List<Track> tracks = trackRepository.findByPackageIdOrderByTimestampAsc(pkg.getPackageId());
            
            Optional<Track> pickupTrack = tracks.stream()
                    .filter(t -> t.getStatus() == TrackStatus.PICKUP)
                    .findFirst();
            
            Optional<Track> signedTrack = tracks.stream()
                    .filter(t -> t.getStatus() == TrackStatus.SIGNED)
                    .findFirst();
            
            if (pickupTrack.isPresent() && signedTrack.isPresent()) {
                long duration = Duration.between(
                        pickupTrack.get().getTimestamp(), 
                        signedTrack.get().getTimestamp()
                ).toHours();
                
                durationsByRoute.computeIfAbsent(routeKey, k -> new ArrayList<>())
                        .add(duration);
            }
        }
        
        Map<String, RouteStats> routeStatsMap = new HashMap<>();
        
        for (Map.Entry<String, List<Long>> entry : durationsByRoute.entrySet()) {
            String routeKey = entry.getKey();
            List<Long> durations = entry.getValue();
            
            if (durations.size() < MIN_SAMPLE_SIZE) {
                continue;
            }
            
            DescriptiveStatistics stats = new DescriptiveStatistics();
            durations.forEach(d -> stats.addValue(d));
            
            RouteStats routeStats = new RouteStats();
            routeStats.totalPackages = durations.size();
            routeStats.meanDuration = stats.getMean();
            routeStats.standardDeviation = stats.getStandardDeviation();
            routeStats.threshold = stats.getMean() + Z_SCORE_THRESHOLD * stats.getStandardDeviation();
            routeStats.minDuration = stats.getMin();
            routeStats.maxDuration = stats.getMax();
            
            String[] parts = routeKey.split("\\|");
            routeStats.fromCity = parts[0];
            routeStats.toCity = parts[1];
            
            routeStatsMap.put(routeKey, routeStats);
        }
        
        return routeStatsMap;
    }

    private RouteStatisticsDTO convertToRouteStatsDTO(String routeKey, RouteStats stats) {
        RouteStatisticsDTO dto = new RouteStatisticsDTO();
        dto.setRouteKey(routeKey);
        dto.setFromCity(stats.fromCity);
        dto.setToCity(stats.toCity);
        dto.setTotalPackages(stats.totalPackages);
        dto.setMeanDurationHours(round(stats.meanDuration));
        dto.setStandardDeviation(round(stats.standardDeviation));
        dto.setThreshold(round(stats.threshold));
        dto.setMinDuration(round(stats.minDuration));
        dto.setMaxDuration(round(stats.maxDuration));
        return dto;
    }

    private AnomalyPackageDTO buildAnomalyPackage(
            Package pkg, List<Track> packageTracks, 
            RouteStatisticsDTO routeStats, long currentDuration, double zScore) {
        
        AnomalyPackageDTO anomaly = new AnomalyPackageDTO();
        anomaly.setPackageId(pkg.getPackageId());
        anomaly.setPackageNo(pkg.getPackageNo());
        anomaly.setSenderCity(pkg.getSenderCity());
        anomaly.setReceiverCity(pkg.getReceiverCity());
        anomaly.setCurrentStatus(pkg.getCurrentStatus().name());
        anomaly.setCurrentStatusDescription(pkg.getCurrentStatus().getDescription());
        
        Track latestTrack = packageTracks.get(packageTracks.size() - 1);
        Track firstTrack = packageTracks.get(0);
        
        anomaly.setPickupTime(firstTrack.getTimestamp());
        anomaly.setLatestUpdateTime(latestTrack.getTimestamp());
        anomaly.setCurrentDurationHours(currentDuration);
        
        anomaly.setMeanDurationHours(routeStats.getMeanDurationHours());
        anomaly.setStandardDeviation(routeStats.getStandardDeviation());
        anomaly.setThreshold(routeStats.getThreshold());
        anomaly.setZScore(round(zScore));
        
        anomaly.setIsAnomaly(true);
        
        String reason = String.format(
                "当前时长 %d 小时，超出阈值 %.1f 小时（均值 %.1f + %.1f×标准差 %.1f），Z分数=%.2f",
                currentDuration,
                routeStats.getThreshold(),
                routeStats.getMeanDurationHours(),
                Z_SCORE_THRESHOLD,
                routeStats.getStandardDeviation(),
                zScore
        );
        anomaly.setAnomalyReason(reason);
        
        anomaly.setSuspectedStuckNodes(findSuspectedStuckNodes(packageTracks, currentDuration, zScore));
        anomaly.setDetectedAt(LocalDateTime.now());
        
        return anomaly;
    }

    private List<SuspectedStuckNode> findSuspectedStuckNodes(
            List<Track> packageTracks, long totalDuration, double zScore) {
        
        List<SuspectedStuckNode> nodes = new ArrayList<>();
        
        Map<String, List<Track>> tracksByLocation = packageTracks.stream()
                .collect(Collectors.groupingBy(Track::getLocation));
        
        for (Map.Entry<String, List<Track>> entry : tracksByLocation.entrySet()) {
            String location = entry.getKey();
            List<Track> locationTracks = entry.getValue();
            
            if (locationTracks.size() >= 2) {
                Track first = locationTracks.get(0);
                Track last = locationTracks.get(locationTracks.size() - 1);
                long stayDuration = Duration.between(first.getTimestamp(), last.getTimestamp()).toHours();
                
                if (stayDuration >= 12) {
                    SuspectedStuckNode node = new SuspectedStuckNode();
                    node.setCenterName(location);
                    node.setLocation(location);
                    node.setLatitude(first.getLatitude());
                    node.setLongitude(first.getLongitude());
                    node.setStuckHours(stayDuration);
                    node.setStatus(first.getStatus().name());
                    
                    double probability = Math.min(1.0, stayDuration / 48.0) * (zScore / 3.0);
                    node.setProbability(round(probability));
                    
                    nodes.add(node);
                }
            }
        }
        
        Track latestTrack = packageTracks.get(packageTracks.size() - 1);
        long currentStayDuration = Duration.between(latestTrack.getTimestamp(), LocalDateTime.now()).toHours();
        
        if (currentStayDuration >= 6) {
            SuspectedStuckNode currentNode = new SuspectedStuckNode();
            currentNode.setCenterName(latestTrack.getLocation());
            currentNode.setLocation(latestTrack.getLocation());
            currentNode.setLatitude(latestTrack.getLatitude());
            currentNode.setLongitude(latestTrack.getLongitude());
            currentNode.setStuckHours(currentStayDuration);
            currentNode.setStatus(latestTrack.getStatus().name());
            
            double probability = Math.min(1.0, currentStayDuration / 24.0) * (zScore / 3.0);
            currentNode.setProbability(round(Math.max(probability, 0.5)));
            
            boolean exists = nodes.stream().anyMatch(n -> n.getCenterName().equals(currentNode.getCenterName()));
            if (!exists) {
                nodes.add(0, currentNode);
            }
        }
        
        nodes.sort((a, b) -> Double.compare(b.getProbability(), a.getProbability()));
        
        return nodes;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public List<AnomalyPackageDTO> getAnomalyList() {
        try {
            @SuppressWarnings("unchecked")
            List<AnomalyPackageDTO> cached = (List<AnomalyPackageDTO>) redisTemplate.opsForValue().get(ANOMALIES_CACHE);
            if (cached != null && !cached.isEmpty()) {
                log.debug("从Redis获取异常包裹列表");
                return cached;
            }
        } catch (Exception e) {
            log.warn("读取Redis异常列表失败: {}", e.getMessage());
        }
        
        AnomalyDetectionResultDTO result = detectAnomalies();
        return result.getAnomalies();
    }

    public List<RouteStatisticsDTO> getRouteStatistics() {
        try {
            @SuppressWarnings("unchecked")
            List<RouteStatisticsDTO> cached = (List<RouteStatisticsDTO>) redisTemplate.opsForValue().get(ROUTE_STATS_CACHE);
            if (cached != null && !cached.isEmpty()) {
                return cached;
            }
        } catch (Exception e) {
            log.warn("读取Redis线路统计失败: {}", e.getMessage());
        }
        
        return detectAnomalies().getRouteStatistics();
    }

    private void cacheRouteStatistics(List<RouteStatisticsDTO> stats) {
        try {
            redisTemplate.opsForValue().set(ROUTE_STATS_CACHE, stats, 1, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("缓存线路统计失败: {}", e.getMessage());
        }
    }

    private void cacheAnomalies(List<AnomalyPackageDTO> anomalies) {
        try {
            redisTemplate.opsForValue().set(ANOMALIES_CACHE, anomalies, 30, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("缓存异常列表失败: {}", e.getMessage());
        }
    }

    public void invalidateCache() {
        try {
            redisTemplate.delete(ANOMALIES_CACHE);
            redisTemplate.delete(ROUTE_STATS_CACHE);
        } catch (Exception e) {
            log.warn("清除异常检测缓存失败: {}", e.getMessage());
        }
    }

    public AnomalyDetectionResultDTO forceDetect() {
        invalidateCache();
        return detectAnomalies();
    }

    private static class RouteStats {
        String fromCity;
        String toCity;
        long totalPackages;
        double meanDuration;
        double standardDeviation;
        double threshold;
        double minDuration;
        double maxDuration;
    }
}
