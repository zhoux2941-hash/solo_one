package com.logistics.track.service;

import com.logistics.track.dto.TrackDTO;
import com.logistics.track.entity.Package;
import com.logistics.track.entity.Track;
import com.logistics.track.entity.TrackStatus;
import com.logistics.track.repository.PackageRepository;
import com.logistics.track.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrackService {

    private final TrackRepository trackRepository;
    private final PackageRepository packageRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String TRACK_CACHE_PREFIX = "track:package:";
    private static final int MAX_CACHE_SIZE = 20;

    @Transactional
    public Track addTrack(Long packageId, Track track) {
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("包裹不存在: " + packageId));
        
        track.setPackageId(packageId);
        if (track.getTimestamp() == null) {
            track.setTimestamp(LocalDateTime.now());
        }
        
        Track saved = trackRepository.save(track);
        
        pkg.setCurrentStatus(track.getStatus());
        packageRepository.save(pkg);
        
        addToCache(packageId, saved);
        
        return saved;
    }

    public List<TrackDTO> getTracksByPackageId(Long packageId) {
        List<TrackDTO> cachedTracks = getFromCache(packageId);
        if (cachedTracks != null && !cachedTracks.isEmpty()) {
            log.debug("从Redis缓存获取包裹 {} 的轨迹", packageId);
            return cachedTracks;
        }
        
        List<Track> tracks = trackRepository.findByPackageIdOrderByTimestampDesc(packageId);
        List<TrackDTO> trackDTOs = convertToDTOsWithDuration(tracks);
        
        if (!trackDTOs.isEmpty()) {
            setCache(packageId, trackDTOs);
        }
        
        return trackDTOs;
    }

    public Page<TrackDTO> getTracksByPackageIdPaginated(Long packageId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Track> trackPage = trackRepository.findByPackageIdOrderByTimestampDesc(packageId, pageable);
        return trackPage.map(this::convertToDTO);
    }

    private List<TrackDTO> convertToDTOsWithDuration(List<Track> tracks) {
        List<Track> sortedTracks = new ArrayList<>(tracks);
        sortedTracks.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        
        List<TrackDTO> dtos = new ArrayList<>();
        for (int i = 0; i < sortedTracks.size(); i++) {
            Track track = sortedTracks.get(i);
            TrackDTO dto = convertToDTO(track);
            
            if (i < sortedTracks.size() - 1) {
                Track nextTrack = sortedTracks.get(i + 1);
                Duration duration = Duration.between(nextTrack.getTimestamp(), track.getTimestamp());
                dto.setStayDurationHours(duration.toHours());
            }
            
            dtos.add(dto);
        }
        
        return dtos;
    }

    private TrackDTO convertToDTO(Track track) {
        TrackDTO dto = new TrackDTO();
        dto.setTrackId(track.getTrackId());
        dto.setPackageId(track.getPackageId());
        dto.setLocation(track.getLocation());
        dto.setStatus(track.getStatus());
        dto.setStatusDescription(track.getStatus().getDescription());
        dto.setTimestamp(track.getTimestamp());
        dto.setLatitude(track.getLatitude());
        dto.setLongitude(track.getLongitude());
        dto.setRemark(track.getRemark());
        return dto;
    }

    private void addToCache(Long packageId, Track track) {
        String key = TRACK_CACHE_PREFIX + packageId;
        List<TrackDTO> cachedTracks = getFromCache(packageId);
        if (cachedTracks == null) {
            cachedTracks = new ArrayList<>();
        }
        
        cachedTracks.add(0, convertToDTO(track));
        if (cachedTracks.size() > MAX_CACHE_SIZE) {
            cachedTracks = cachedTracks.subList(0, MAX_CACHE_SIZE);
        }
        
        setCache(packageId, cachedTracks);
    }

    @SuppressWarnings("unchecked")
    private List<TrackDTO> getFromCache(Long packageId) {
        String key = TRACK_CACHE_PREFIX + packageId;
        try {
            return (List<TrackDTO>) redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.warn("读取Redis缓存失败: {}", e.getMessage());
            return null;
        }
    }

    private void setCache(Long packageId, List<TrackDTO> tracks) {
        String key = TRACK_CACHE_PREFIX + packageId;
        try {
            redisTemplate.opsForValue().set(key, tracks, Duration.ofHours(1));
        } catch (Exception e) {
            log.warn("写入Redis缓存失败: {}", e.getMessage());
        }
    }

    public void invalidateCache(Long packageId) {
        String key = TRACK_CACHE_PREFIX + packageId;
        redisTemplate.delete(key);
    }
}
