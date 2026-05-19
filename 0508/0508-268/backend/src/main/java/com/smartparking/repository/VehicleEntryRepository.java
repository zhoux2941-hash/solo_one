package com.smartparking.repository;

import com.smartparking.entity.VehicleEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleEntryRepository extends JpaRepository<VehicleEntry, Long> {
    
    Optional<VehicleEntry> findByPlateNumberAndStatus(String plateNumber, String status);
    
    List<VehicleEntry> findByParkingLotIdAndStatus(Long parkingLotId, String status);
    
    List<VehicleEntry> findByEntryTimeBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT COUNT(ve) FROM VehicleEntry ve WHERE ve.parkingLotId = ?1 AND ve.status = 'PARKING'")
    long countParkingVehicles(Long parkingLotId);
}
