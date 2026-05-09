package com.petboarding.service;

import com.petboarding.entity.BoardingCenter;
import com.petboarding.entity.Room;
import com.petboarding.repository.BoardingCenterRepository;
import com.petboarding.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CenterService {
    
    private final BoardingCenterRepository boardingCenterRepository;
    private final RoomRepository roomRepository;
    
    public List<BoardingCenter> getAllCenters() {
        return boardingCenterRepository.findAll();
    }
    
    public Optional<BoardingCenter> getCenterById(Long centerId) {
        return boardingCenterRepository.findById(centerId);
    }
    
    public List<Room> getRoomsByCenter(Long centerId) {
        return roomRepository.findByCenterId(centerId);
    }
    
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }
    
    public Optional<Room> getRoomById(Long roomId) {
        return roomRepository.findById(roomId);
    }
    
    public List<String> getAllRoomTypes() {
        return roomRepository.findAllRoomTypes();
    }
    
    public Map<String, Object> getCenterWithRooms(Long centerId) {
        Map<String, Object> result = new HashMap<>();
        
        BoardingCenter center = boardingCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Center not found"));
        
        List<Room> rooms = roomRepository.findByCenterId(centerId);
        
        result.put("center", center);
        result.put("rooms", rooms);
        
        return result;
    }
    
    public List<Map<String, Object>> getAllCentersWithRooms() {
        List<BoardingCenter> centers = boardingCenterRepository.findAll();
        Map<Long, List<Room>> roomsByCenter = roomRepository.findAll().stream()
                .collect(Collectors.groupingBy(Room::getCenterId));
        
        return centers.stream().map(center -> {
            Map<String, Object> data = new HashMap<>();
            data.put("center", center);
            data.put("rooms", roomsByCenter.getOrDefault(center.getCenterId(), List.of()));
            return data;
        }).collect(Collectors.toList());
    }
}
