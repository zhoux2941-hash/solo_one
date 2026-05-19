package com.smartparking.service;

import com.smartparking.entity.ParkingSpace;
import com.smartparking.exception.BusinessException;
import com.smartparking.repository.ParkingSpaceRepository;
import com.smartparking.websocket.ParkingWebSocketServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParkingSpaceService {

    private final ParkingSpaceRepository parkingSpaceRepository;
    private final ParkingWebSocketServer webSocketServer;

    public List<ParkingSpace> getSpacesByParkingLot(Long parkingLotId) {
        return parkingSpaceRepository.findByParkingLotId(parkingLotId);
    }

    public List<ParkingSpace> getAvailableSpaces(Long parkingLotId) {
        return parkingSpaceRepository.findByParkingLotIdAndStatus(parkingLotId, "AVAILABLE");
    }

    public long getAvailableCount(Long parkingLotId) {
        return parkingSpaceRepository.countByParkingLotIdAndStatus(parkingLotId, "AVAILABLE");
    }

    @Transactional
    public void updateSpaceStatus(Long spaceId, String status) {
        ParkingSpace space = parkingSpaceRepository.findById(spaceId)
                .orElseThrow(() -> new BusinessException("车位不存在"));
        
        space.setStatus(status);
        parkingSpaceRepository.save(space);
        
        webSocketServer.broadcastParkingSpaceUpdate(space.getParkingLotId(), spaceId, status);
        
        log.info("车位状态更新: spaceId={}, status={}", spaceId, status);
    }

    @Transactional
    public ParkingSpace createParkingSpace(ParkingSpace space) {
        return parkingSpaceRepository.save(space);
    }

    @Transactional
    public void deleteParkingSpace(Long id) {
        parkingSpaceRepository.deleteById(id);
    }
}
