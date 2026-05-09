package com.delivery.service;

import com.delivery.dto.GpsReportDTO;
import com.delivery.entity.Rider;
import com.delivery.entity.RiderTrack;
import com.delivery.repository.RiderRepository;
import com.delivery.repository.RiderTrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GpsService {

    private final RiderTrackRepository riderTrackRepository;
    private final RiderRepository riderRepository;
    private final RedisGeoService redisGeoService;

    @Transactional
    public void reportGps(GpsReportDTO dto) {
        RiderTrack track = new RiderTrack();
        track.setRiderId(dto.getRiderId());
        track.setOrderId(dto.getOrderId());
        track.setLng(dto.getLng());
        track.setLat(dto.getLat());
        track.setReportedAt(LocalDateTime.now());
        riderTrackRepository.save(track);

        riderRepository.findByRiderId(dto.getRiderId()).ifPresent(rider -> {
            rider.setCurrentLng(dto.getLng());
            rider.setCurrentLat(dto.getLat());
            rider.setCurrentOrderId(dto.getOrderId());
            rider.setStatus("DELIVERING");
            riderRepository.save(rider);
        });

        redisGeoService.addRiderLocation(dto.getRiderId(), dto.getLng(), dto.getLat());
    }
}
