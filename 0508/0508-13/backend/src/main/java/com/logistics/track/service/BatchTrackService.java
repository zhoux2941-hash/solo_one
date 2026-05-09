package com.logistics.track.service;

import com.logistics.track.data.CityCenterConfig;
import com.logistics.track.dto.RouteAggregationDTO;
import com.logistics.track.dto.TrackSummaryDTO;
import com.logistics.track.entity.Package;
import com.logistics.track.entity.Track;
import com.logistics.track.entity.TrackStatus;
import com.logistics.track.repository.PackageRepository;
import com.logistics.track.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class BatchTrackService {

    private final TrackRepository trackRepository;
    private final PackageRepository packageRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String BATCH_CACHE_PREFIX = "batch:track:";
    private static final String ROUTE_CACHE_KEY = "batch:route:aggregation";
    private static final int BATCH_SIZE = 100;

    public List<TrackSummaryDTO> getBatchTrackSummary(List<Long> packageIds) {
        if (packageIds == null || packageIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<TrackSummaryDTO> result = new ArrayList<>();
        List<Long> needQuery = new ArrayList<>();

        for (Long packageId : packageIds) {
            String cacheKey = BATCH_CACHE_PREFIX + packageId;
            try {
                TrackSummaryDTO cached = (TrackSummaryDTO) redisTemplate.opsForValue().get(cacheKey);
                if (cached != null) {
                    result.add(cached);
                } else {
                    needQuery.add(packageId);
                }
            } catch (Exception e) {
                needQuery.add(packageId);
            }
        }

        if (!needQuery.isEmpty()) {
            log.debug("批量查询 {} 个包裹的概要轨迹", needQuery.size());
            List<TrackSummaryDTO> summaries = fetchBatchTrackSummary(needQuery);
            for (TrackSummaryDTO summary : summaries) {
                String cacheKey = BATCH_CACHE_PREFIX + summary.getPackageId();
                try {
                    redisTemplate.opsForValue().set(cacheKey, summary, 30, TimeUnit.MINUTES);
                } catch (Exception e) {
                    log.warn("缓存概要轨迹失败: {}", e.getMessage());
                }
            }
            result.addAll(summaries);
        }

        return result;
    }

    private List<TrackSummaryDTO> fetchBatchTrackSummary(List<Long> packageIds) {
        List<Package> packages = packageRepository.findAllById(packageIds);
        Map<Long, Package> packageMap = packages.stream()
                .collect(Collectors.toMap(Package::getPackageId, p -> p));

        List<TrackStatus> keyStatuses = Arrays.asList(
                TrackStatus.PICKUP,
                TrackStatus.SIGNED
        );

        List<Track> allTracks = trackRepository.findByPackageIdsAndStatuses(packageIds, keyStatuses);

        Map<Long, List<Track>> tracksByPackage = allTracks.stream()
                .collect(Collectors.groupingBy(Track::getPackageId));

        List<TrackSummaryDTO> result = new ArrayList<>();

        for (Long packageId : packageIds) {
            Package pkg = packageMap.get(packageId);
            if (pkg == null) continue;

            List<Track> packageTracks = tracksByPackage.getOrDefault(packageId, new ArrayList<>());
            packageTracks.sort(Comparator.comparing(Track::getTimestamp));

            TrackSummaryDTO summary = buildTrackSummary(pkg, packageTracks);
            result.add(summary);
        }

        return result;
    }

    private TrackSummaryDTO buildTrackSummary(Package pkg, List<Track> tracks) {
        TrackSummaryDTO summary = new TrackSummaryDTO();
        summary.setPackageId(pkg.getPackageId());
        summary.setPackageNo(pkg.getPackageNo());
        summary.setSenderCity(pkg.getSenderCity());
        summary.setReceiverCity(pkg.getReceiverCity());
        summary.setCurrentStatus(pkg.getCurrentStatus().name());
        summary.setCurrentStatusDescription(pkg.getCurrentStatus().getDescription());
        summary.setIsCompleted(pkg.getCurrentStatus() == TrackStatus.SIGNED);

        CityCenterConfig fromCenter = CityCenterConfig.findByCityName(pkg.getSenderCity());
        CityCenterConfig toCenter = CityCenterConfig.findByCityName(pkg.getReceiverCity());

        if (fromCenter != null) {
            TrackSummaryDTO.SummaryTrack pickup = new TrackSummaryDTO.SummaryTrack();
            pickup.setLocation(fromCenter.getCenterName());
            pickup.setLatitude(fromCenter.getLatitude());
            pickup.setLongitude(fromCenter.getLongitude());
            pickup.setStatus(TrackStatus.PICKUP.name());
            summary.setPickup(pickup);
        }

        if (toCenter != null) {
            TrackSummaryDTO.SummaryTrack latest = new TrackSummaryDTO.SummaryTrack();
            latest.setLocation(toCenter.getCenterName());
            latest.setLatitude(toCenter.getLatitude());
            latest.setLongitude(toCenter.getLongitude());
            latest.setStatus(pkg.getCurrentStatus().name());
            summary.setLatest(latest);

            if (pkg.getCurrentStatus() == TrackStatus.SIGNED) {
                TrackSummaryDTO.SummaryTrack signed = new TrackSummaryDTO.SummaryTrack();
                signed.setLocation(toCenter.getCenterName());
                signed.setLatitude(toCenter.getLatitude());
                signed.setLongitude(toCenter.getLongitude());
                signed.setStatus(TrackStatus.SIGNED.name());
                summary.setSigned(signed);
            }
        }

        if (!tracks.isEmpty()) {
            Track firstTrack = tracks.get(0);
            Track lastTrack = tracks.get(tracks.size() - 1);

            if (summary.getPickup() != null) {
                summary.getPickup().setTimestamp(formatDateTime(firstTrack.getTimestamp()));
            }

            if (summary.getLatest() != null) {
                summary.getLatest().setTimestamp(formatDateTime(lastTrack.getTimestamp()));
            }

            if (summary.getSigned() != null) {
                summary.getSigned().setTimestamp(formatDateTime(lastTrack.getTimestamp()));
            }

            if (summary.getPickup() != null && summary.getSigned() != null) {
                Duration duration = Duration.between(firstTrack.getTimestamp(), lastTrack.getTimestamp());
                summary.setTotalHours(duration.toHours());

                if (summary.getPickup().getLatitude() != null && summary.getSigned().getLatitude() != null) {
                    double distance = calculateDistance(
                            summary.getPickup().getLatitude(), summary.getPickup().getLongitude(),
                            summary.getSigned().getLatitude(), summary.getSigned().getLongitude()
                    );
                    summary.setTotalDistance(Math.round(distance * 100.0) / 100.0);
                }
            }
        }

        return summary;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return dateTime.format(formatter);
    }

    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public List<RouteAggregationDTO> getRouteAggregation() {
        try {
            @SuppressWarnings("unchecked")
            List<RouteAggregationDTO> cached = (List<RouteAggregationDTO>) redisTemplate.opsForValue().get(ROUTE_CACHE_KEY);
            if (cached != null && !cached.isEmpty()) {
                log.debug("从Redis获取线路聚合数据");
                return cached;
            }
        } catch (Exception e) {
            log.warn("读取Redis线路聚合数据失败: {}", e.getMessage());
        }

        log.debug("计算线路聚合数据");
        List<RouteAggregationDTO> aggregations = calculateRouteAggregation();

        if (!aggregations.isEmpty()) {
            try {
                redisTemplate.opsForValue().set(ROUTE_CACHE_KEY, aggregations, 1, TimeUnit.HOURS);
            } catch (Exception e) {
                log.warn("缓存线路聚合数据失败: {}", e.getMessage());
            }
        }

        return aggregations;
    }

    private List<RouteAggregationDTO> calculateRouteAggregation() {
        List<Package> allPackages = packageRepository.findAll();

        Map<String, RouteStats> routeMap = new HashMap<>();

        for (Package pkg : allPackages) {
            String routeKey = pkg.getSenderCity() + "|" + pkg.getReceiverCity();

            RouteStats stats = routeMap.computeIfAbsent(routeKey, k -> {
                RouteStats s = new RouteStats();
                s.fromCity = pkg.getSenderCity();
                s.toCity = pkg.getReceiverCity();
                s.packageIds = new ArrayList<>();
                s.completedDurations = new ArrayList<>();
                return s;
            });

            stats.totalPackages++;
            stats.packageIds.add(pkg.getPackageId());
        }

        List<RouteAggregationDTO> result = new ArrayList<>();

        for (RouteStats stats : routeMap.values()) {
            if (stats.totalPackages < 1) continue;

            RouteAggregationDTO dto = new RouteAggregationDTO();
            dto.setFromCity(stats.fromCity);
            dto.setToCity(stats.toCity);
            dto.setRouteKey(stats.fromCity + " -> " + stats.toCity);
            dto.setTotalPackages(stats.totalPackages);

            CityCenterConfig fromCenter = CityCenterConfig.findByCityName(stats.fromCity);
            CityCenterConfig toCenter = CityCenterConfig.findByCityName(stats.toCity);

            if (fromCenter != null) {
                dto.setFromLatitude(fromCenter.getLatitude());
                dto.setFromLongitude(fromCenter.getLongitude());
            }

            if (toCenter != null) {
                dto.setToLatitude(toCenter.getLatitude());
                dto.setToLongitude(toCenter.getLongitude());
            }

            if (dto.getFromLatitude() != null && dto.getToLatitude() != null) {
                double distance = calculateDistance(
                        dto.getFromLatitude(), dto.getFromLongitude(),
                        dto.getToLatitude(), dto.getToLongitude()
                );
                dto.setAvgDistance(Math.round(distance * 100.0) / 100.0);
            }

            stats.packageIds.sort(Long::compareTo);
            int sampleCount = Math.min(5, stats.packageIds.size());
            List<Long> samples = new ArrayList<>();
            for (int i = 0; i < sampleCount; i++) {
                samples.add(stats.packageIds.get(i * stats.packageIds.size() / sampleCount));
            }
            dto.setSamplePackageIds(samples);

            if (!samples.isEmpty()) {
                List<TrackSummaryDTO> sampleSummaries = getBatchTrackSummary(samples);
                if (!sampleSummaries.isEmpty()) {
                    dto.setRepresentativePackage(sampleSummaries.get(0));

                    double avgDuration = sampleSummaries.stream()
                            .filter(s -> s.getTotalHours() != null)
                            .mapToLong(TrackSummaryDTO::getTotalHours)
                            .average()
                            .orElse(0);
                    dto.setAvgDurationHours(Math.round(avgDuration * 100.0) / 100.0);
                }
            }

            result.add(dto);
        }

        result.sort((a, b) -> b.getTotalPackages().compareTo(a.getTotalPackages()));

        return result;
    }

    public List<TrackSummaryDTO> getAllTrackSummaries() {
        List<Long> allPackageIds = packageRepository.findAll().stream()
                .map(Package::getPackageId)
                .collect(Collectors.toList());

        if (allPackageIds.size() <= 200) {
            return getBatchTrackSummary(allPackageIds);
        }

        List<TrackSummaryDTO> result = new ArrayList<>();
        for (int i = 0; i < allPackageIds.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, allPackageIds.size());
            List<Long> batch = allPackageIds.subList(i, end);
            result.addAll(getBatchTrackSummary(batch));
        }

        return result;
    }

    public void invalidateBatchCache(Long packageId) {
        String cacheKey = BATCH_CACHE_PREFIX + packageId;
        try {
            redisTemplate.delete(cacheKey);
        } catch (Exception e) {
            log.warn("清除批量缓存失败: {}", e.getMessage());
        }
    }

    public void invalidateRouteCache() {
        try {
            redisTemplate.delete(ROUTE_CACHE_KEY);
        } catch (Exception e) {
            log.warn("清除线路聚合缓存失败: {}", e.getMessage());
        }
    }

    private static class RouteStats {
        String fromCity;
        String toCity;
        long totalPackages = 0;
        List<Long> packageIds;
        List<Long> completedDurations;
    }
}
