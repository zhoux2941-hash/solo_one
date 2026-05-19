package com.smartparking.controller;

import com.smartparking.common.Result;
import com.smartparking.entity.ParkingSpace;
import com.smartparking.entity.VehicleEntry;
import com.smartparking.repository.ParkingSpaceRepository;
import com.smartparking.repository.VehicleEntryRepository;
import com.smartparking.websocket.ParkingWebSocketServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/ws/sync")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WebSocketSyncController {

    private final ParkingSpaceRepository parkingSpaceRepository;
    private final VehicleEntryRepository vehicleEntryRepository;

    @GetMapping("/full")
    public Result<Map<String, Object>> getFullSyncData(
            @RequestParam(required = false) Long parkingLotId,
            @RequestParam(required = false, defaultValue = "0") Long lastSyncTime) {
        
        log.info("全量同步请求，parkingLotId: {}, lastSyncTime: {}", parkingLotId, lastSyncTime);
        
        Map<String, Object> syncData = new HashMap<>();
        syncData.put("syncType", "FULL");
        syncData.put("syncTime", System.currentTimeMillis());
        syncData.put("serverTime", LocalDateTime.now().toString());
        
        List<ParkingSpace> spaces;
        if (parkingLotId != null) {
            spaces = parkingSpaceRepository.findByParkingLotId(parkingLotId);
        } else {
            spaces = parkingSpaceRepository.findAll();
        }
        
        List<Map<String, Object>> spaceData = spaces.stream()
                .map(space -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", space.getId());
                    map.put("parkingLotId", space.getParkingLotId());
                    map.put("spaceNo", space.getSpaceNo());
                    map.put("area", space.getArea());
                    map.put("status", space.getStatus());
                    map.put("plateNumber", space.getPlateNumber());
                    map.put("updateTime", space.getUpdateTime() != null ? space.getUpdateTime().toString() : "");
                    return map;
                })
                .collect(Collectors.toList());
        
        syncData.put("parkingSpaces", spaceData);
        
        List<VehicleEntry> parkingVehicles = vehicleEntryRepository.findAll().stream()
                .filter(v -> "PARKING".equals(v.getStatus()))
                .collect(Collectors.toList());
        
        List<Map<String, Object>> vehicleData = parkingVehicles.stream()
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", entry.getId());
                    map.put("parkingLotId", entry.getParkingLotId());
                    map.put("spaceId", entry.getSpaceId());
                    map.put("plateNumber", entry.getPlateNumber());
                    map.put("entryTime", entry.getEntryTime() != null ? entry.getEntryTime().toString() : "");
                    map.put("status", entry.getStatus());
                    return map;
                })
                .collect(Collectors.toList());
        
        syncData.put("parkingVehicles", vehicleData);
        syncData.put("onlineCount", ParkingWebSocketServer.getOnlineCount());
        
        return Result.success(syncData);
    }

    @GetMapping("/incremental")
    public Result<Map<String, Object>> getIncrementalSyncData(
            @RequestParam Long lastSyncTime,
            @RequestParam(required = false) Long parkingLotId) {
        
        log.info("增量同步请求，lastSyncTime: {}, parkingLotId: {}", lastSyncTime, parkingLotId);
        
        Map<String, Object> syncData = new HashMap<>();
        syncData.put("syncType", "INCREMENTAL");
        syncData.put("syncTime", System.currentTimeMillis());
        
        List<ParkingSpace> spaces;
        if (parkingLotId != null) {
            spaces = parkingSpaceRepository.findByParkingLotId(parkingLotId);
        } else {
            spaces = parkingSpaceRepository.findAll();
        }
        
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(5);
        
        List<Map<String, Object>> updatedSpaces = spaces.stream()
                .filter(s -> s.getUpdateTime() != null && s.getUpdateTime().isAfter(threshold))
                .map(space -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", space.getId());
                    map.put("parkingLotId", space.getParkingLotId());
                    map.put("spaceNo", space.getSpaceNo());
                    map.put("status", space.getStatus());
                    map.put("plateNumber", space.getPlateNumber());
                    map.put("updateTime", space.getUpdateTime().toString());
                    return map;
                })
                .collect(Collectors.toList());
        
        syncData.put("updatedSpaces", updatedSpaces);
        syncData.put("updateCount", updatedSpaces.size());
        
        return Result.success(syncData);
    }

    @GetMapping("/status")
    public Result<Map<String, Object>> getConnectionStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("onlineCount", ParkingWebSocketServer.getOnlineCount());
        status.put("serverTime", System.currentTimeMillis());
        status.put("websocketEnabled", true);
        return Result.success(status);
    }
}
