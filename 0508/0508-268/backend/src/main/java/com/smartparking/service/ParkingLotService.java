package com.smartparking.service;

import com.smartparking.entity.ParkingLot;
import com.smartparking.exception.BusinessException;
import com.smartparking.repository.ParkingLotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ParkingLotService {

    private final ParkingLotRepository parkingLotRepository;

    public List<ParkingLot> getAllParkingLots() {
        return parkingLotRepository.findAll();
    }

    public ParkingLot getParkingLotById(Long id) {
        return parkingLotRepository.findById(id)
                .orElseThrow(() -> new BusinessException("停车场不存在"));
    }

    public List<ParkingLot> getActiveParkingLots() {
        return parkingLotRepository.findByStatus("ACTIVE");
    }

    public ParkingLot createParkingLot(ParkingLot parkingLot) {
        return parkingLotRepository.save(parkingLot);
    }

    public ParkingLot updateParkingLot(Long id, ParkingLot parkingLot) {
        ParkingLot existing = getParkingLotById(id);
        existing.setName(parkingLot.getName());
        existing.setType(parkingLot.getType());
        existing.setAddress(parkingLot.getAddress());
        existing.setTotalSpaces(parkingLot.getTotalSpaces());
        existing.setLongitude(parkingLot.getLongitude());
        existing.setLatitude(parkingLot.getLatitude());
        existing.setStatus(parkingLot.getStatus());
        return parkingLotRepository.save(existing);
    }

    public void deleteParkingLot(Long id) {
        parkingLotRepository.deleteById(id);
    }
}
