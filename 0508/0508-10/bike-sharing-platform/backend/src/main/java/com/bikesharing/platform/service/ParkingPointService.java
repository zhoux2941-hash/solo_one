package com.bikesharing.platform.service;

import com.bikesharing.platform.dto.ParkingPointStatusDTO;
import com.bikesharing.platform.entity.ParkingPoint;
import com.bikesharing.platform.repository.ParkingPointRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParkingPointService {

    private final ParkingPointRepository parkingPointRepository;
    private final RedisService redisService;

    public List<ParkingPointStatusDTO> getAllParkingPointStatus() {
        List<ParkingPoint> points = parkingPointRepository.findAllOrdered();
        List<ParkingPointStatusDTO> dtos = new ArrayList<>();
        
        for (ParkingPoint point : points) {
            Integer redisCount = redisService.getBikeCount(point.getPointId());
            int currentBikes = (redisCount != null) ? redisCount : point.getCurrentBikes();
            
            double utilizationRate = (point.getCapacity() == 0) ? 0.0 : (double) currentBikes / point.getCapacity();
            String status = getStatus(utilizationRate);
            
            dtos.add(ParkingPointStatusDTO.builder()
                .pointId(point.getPointId())
                .name(point.getName())
                .latitude(point.getLatitude())
                .longitude(point.getLongitude())
                .capacity(point.getCapacity())
                .currentBikes(currentBikes)
                .utilizationRate(utilizationRate)
                .status(status)
                .build());
        }
        
        return dtos;
    }

    private String getStatus(double rate) {
        if (rate > 0.8) return "OVER_SATURATED";
        if (rate < 0.2) return "SHORTAGE";
        return "NORMAL";
    }

    @Transactional
    public void initializeRedisData() {
        List<ParkingPoint> points = parkingPointRepository.findAll();
        for (ParkingPoint point : points) {
            if (redisService.getBikeCount(point.getPointId()) == null) {
                redisService.setBikeCount(point.getPointId(), point.getCurrentBikes());
                log.debug("Initialized Redis for point {} with {} bikes", point.getPointId(), point.getCurrentBikes());
            }
        }
    }

    @Transactional
    public void syncRedisToDatabase() {
        List<ParkingPoint> points = parkingPointRepository.findAll();
        for (ParkingPoint point : points) {
            Integer redisCount = redisService.getBikeCount(point.getPointId());
            if (redisCount != null && !redisCount.equals(point.getCurrentBikes())) {
                point.setCurrentBikes(redisCount);
                parkingPointRepository.save(point);
                log.debug("Synced Redis to DB for point {}: {} bikes", point.getPointId(), redisCount);
            }
        }
    }

    public ParkingPoint getParkingPointById(Long pointId) {
        return parkingPointRepository.findById(pointId).orElse(null);
    }
}
