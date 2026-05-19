package com.smartparking.repository;

import com.smartparking.entity.ParkingLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingLotRepository extends JpaRepository<ParkingLot, Long> {
    
    List<ParkingLot> findByStatus(String status);
    
    List<ParkingLot> findByType(String type);
}
