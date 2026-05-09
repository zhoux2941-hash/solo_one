package com.logistics.track.service;

import com.logistics.track.data.CityCenterConfig;
import com.logistics.track.dto.*;
import com.logistics.track.entity.Package;
import com.logistics.track.entity.Track;
import com.logistics.track.entity.TrackStatus;
import com.logistics.track.repository.PackageRepository;
import com.logistics.track.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsService {

    private final TrackRepository trackRepository;
    private final PackageRepository packageRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String STUCK_CENTER_KEY = "statistics:stuck_centers";

    public List<DailyTimeAnalysisDTO> getDailyTimeAnalysis(int days) {
        List<DailyTimeAnalysisDTO> result = new ArrayList<>();
        
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            DailyTimeAnalysisDTO dto = calculateDailyStats(date);
            if (dto != null) {
                result.add(dto);
            }
        }
        
        return result;
    }

    private DailyTimeAnalysisDTO calculateDailyStats(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);
        
        List<Package> allPackages = packageRepository.findAll();
        
        List<Package> completedPackages = allPackages.stream()
                .filter(pkg -> pkg.getCurrentStatus() == TrackStatus.SIGNED)
                .collect(Collectors.toList());
        
        List<Long> durations = new ArrayList<>();
        
        for (Package pkg : completedPackages) {
            List<Track> tracks = trackRepository.findByPackageIdOrderByTimestampAsc(pkg.getPackageId());
            
            Optional<Track> pickupTrack = tracks.stream()
                    .filter(t -> t.getStatus() == TrackStatus.PICKUP)
                    .findFirst();
            
            Optional<Track> signedTrack = tracks.stream()
                    .filter(t -> t.getStatus() == TrackStatus.SIGNED)
                    .findFirst();
            
            if (pickupTrack.isPresent() && signedTrack.isPresent()) {
                Duration duration = Duration.between(pickupTrack.get().getTimestamp(), signedTrack.get().getTimestamp());
                durations.add(duration.toHours());
            }
        }
        
        if (durations.isEmpty()) {
            return null;
        }
        
        double avgDuration = durations.stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0.0);
        
        DailyTimeAnalysisDTO dto = new DailyTimeAnalysisDTO();
        dto.setDate(date);
        dto.setTotalPackages((long) durations.size());
        dto.setAverageDurationHours(Math.round(avgDuration * 100.0) / 100.0);
        
        return dto;
    }

    public List<RouteTimeAnalysisDTO> getRouteTimeAnalysis() {
        Map<String, RouteStats> routeStatsMap = new HashMap<>();
        
        List<Package> completedPackages = packageRepository.findAll().stream()
                .filter(pkg -> pkg.getCurrentStatus() == TrackStatus.SIGNED)
                .collect(Collectors.toList());
        
        for (Package pkg : completedPackages) {
            String fromCity = pkg.getSenderCity();
            String toCity = pkg.getReceiverCity();
            String route = fromCity + " -> " + toCity;
            
            List<Track> tracks = trackRepository.findByPackageIdOrderByTimestampAsc(pkg.getPackageId());
            
            Optional<Track> pickupTrack = tracks.stream()
                    .filter(t -> t.getStatus() == TrackStatus.PICKUP)
                    .findFirst();
            
            Optional<Track> signedTrack = tracks.stream()
                    .filter(t -> t.getStatus() == TrackStatus.SIGNED)
                    .findFirst();
            
            if (pickupTrack.isPresent() && signedTrack.isPresent()) {
                Duration duration = Duration.between(pickupTrack.get().getTimestamp(), signedTrack.get().getTimestamp());
                long hours = duration.toHours();
                
                RouteStats stats = routeStatsMap.computeIfAbsent(route, k -> {
                    RouteStats s = new RouteStats();
                    s.fromCity = fromCity;
                    s.toCity = toCity;
                    return s;
                });
                
                stats.totalPackages++;
                stats.totalHours += hours;
                stats.durations.add(hours);
            }
        }
        
        return routeStatsMap.values().stream()
                .map(stats -> {
                    RouteTimeAnalysisDTO dto = new RouteTimeAnalysisDTO();
                    dto.setFromCity(stats.fromCity);
                    dto.setToCity(stats.toCity);
                    dto.setRoute(stats.fromCity + " -> " + stats.toCity);
                    dto.setTotalPackages(stats.totalPackages);
                    dto.setAverageDurationHours(Math.round((stats.totalHours * 100.0 / stats.totalPackages)) / 100.0);
                    dto.setMinDurationHours(Collections.min(stats.durations));
                    dto.setMaxDurationHours(Collections.max(stats.durations));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<StuckCenterDTO> getStuckCenters() {
        try {
            @SuppressWarnings("unchecked")
            List<StuckCenterDTO> cached = (List<StuckCenterDTO>) redisTemplate.opsForValue().get(STUCK_CENTER_KEY);
            if (cached != null) {
                log.debug("从Redis获取滞留中心数据");
                return cached;
            }
        } catch (Exception e) {
            log.warn("读取Redis滞留中心数据失败: {}", e.getMessage());
        }
        
        return calculateStuckCenters();
    }

    public List<StuckCenterDTO> calculateAndCacheStuckCenters() {
        List<StuckCenterDTO> centers = calculateStuckCenters();
        try {
            redisTemplate.opsForValue().set(STUCK_CENTER_KEY, centers, Duration.ofHours(1));
            log.info("已缓存 {} 个转运中心滞留数据", centers.size());
        } catch (Exception e) {
            log.warn("缓存滞留中心数据失败: {}", e.getMessage());
        }
        return centers;
    }

    private List<StuckCenterDTO> calculateStuckCenters() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
        
        Map<String, CenterStuckInfo> centerMap = new HashMap<>();
        
        for (CityCenterConfig center : CityCenterConfig.getAllCenters()) {
            CenterStuckInfo info = new CenterStuckInfo();
            info.centerName = center.getCenterName();
            info.location = center.getCityName();
            info.latitude = center.getLatitude();
            info.longitude = center.getLongitude();
            centerMap.put(center.getCenterName(), info);
        }
        
        List<Package> packages = packageRepository.findAll();
        
        for (Package pkg : packages) {
            if (pkg.getCurrentStatus() == TrackStatus.SIGNED) {
                continue;
            }
            
            List<Track> tracks = trackRepository.findByPackageIdOrderByTimestampDesc(pkg.getPackageId());
            if (tracks.isEmpty()) {
                continue;
            }
            
            Track latestTrack = tracks.get(0);
            
            if (latestTrack.getTimestamp().isBefore(cutoffTime)) {
                String centerName = latestTrack.getLocation();
                CenterStuckInfo info = centerMap.get(centerName);
                
                if (info == null) {
                    info = new CenterStuckInfo();
                    info.centerName = centerName;
                    info.location = centerName;
                    info.latitude = latestTrack.getLatitude();
                    info.longitude = latestTrack.getLongitude();
                    centerMap.put(centerName, info);
                }
                
                Duration stuckDuration = Duration.between(latestTrack.getTimestamp(), LocalDateTime.now());
                info.stuckCount++;
                info.totalStuckHours += stuckDuration.toHours();
            }
        }
        
        return centerMap.values().stream()
                .filter(info -> info.stuckCount > 0)
                .map(info -> {
                    StuckCenterDTO dto = new StuckCenterDTO();
                    dto.setCenterName(info.centerName);
                    dto.setLocation(info.location);
                    dto.setLatitude(info.latitude);
                    dto.setLongitude(info.longitude);
                    dto.setStuckCount(info.stuckCount);
                    dto.setStuckHours(info.totalStuckHours / Math.max(1, info.stuckCount));
                    return dto;
                })
                .sorted((a, b) -> b.getStuckCount().compareTo(a.getStuckCount()))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getSankeyData() {
        List<Package> allPackages = packageRepository.findAll();
        
        Map<String, Integer> nodeIndexMap = new LinkedHashMap<>();
        List<SankeyNodeDTO> nodes = new ArrayList<>();
        Map<String, Long> linkMap = new HashMap<>();
        
        int index = 0;
        
        for (Package pkg : allPackages) {
            String fromCity = pkg.getSenderCity();
            String toCity = pkg.getReceiverCity();
            
            if (!nodeIndexMap.containsKey(fromCity)) {
                SankeyNodeDTO node = new SankeyNodeDTO();
                node.setName(fromCity);
                node.setIndex(index);
                nodes.add(node);
                nodeIndexMap.put(fromCity, index++);
            }
            
            if (!nodeIndexMap.containsKey(toCity)) {
                SankeyNodeDTO node = new SankeyNodeDTO();
                node.setName(toCity);
                node.setIndex(index);
                nodes.add(node);
                nodeIndexMap.put(toCity, index++);
            }
            
            String linkKey = fromCity + "|" + toCity;
            linkMap.put(linkKey, linkMap.getOrDefault(linkKey, 0L) + 1);
        }
        
        List<SankeyLinkDTO> links = new ArrayList<>();
        for (Map.Entry<String, Long> entry : linkMap.entrySet()) {
            String[] parts = entry.getKey().split("\\|");
            String fromCity = parts[0];
            String toCity = parts[1];
            
            SankeyLinkDTO link = new SankeyLinkDTO();
            link.setSource(nodeIndexMap.get(fromCity));
            link.setTarget(nodeIndexMap.get(toCity));
            link.setValue(entry.getValue());
            link.setSourceName(fromCity);
            link.setTargetName(toCity);
            links.add(link);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("nodes", nodes);
        result.put("links", links);
        
        return result;
    }

    private static class RouteStats {
        String fromCity;
        String toCity;
        long totalPackages = 0;
        long totalHours = 0;
        List<Long> durations = new ArrayList<>();
    }

    private static class CenterStuckInfo {
        String centerName;
        String location;
        Double latitude;
        Double longitude;
        long stuckCount = 0;
        long totalStuckHours = 0;
    }
}
