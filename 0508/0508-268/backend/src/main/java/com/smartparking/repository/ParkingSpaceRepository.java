package com.smartparking.repository;

import com.smartparking.entity.ParkingSpace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingSpaceRepository extends JpaRepository<ParkingSpace, Long> {
    
    List<ParkingSpace> findByParkingLotId(Long parkingLotId);
    
    List<ParkingSpace> findByParkingLotIdAndStatus(Long parkingLotId, String status);
    
    long countByParkingLotIdAndStatus(Long parkingLotId, String status);
    
    @Modifying
    @Query("UPDATE ParkingSpace ps SET ps.status = ?2 WHERE ps.id = ?1")
    int updateStatus(Long id, String status);
}
