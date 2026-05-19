package com.smartparking.repository;

import com.smartparking.entity.RateConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RateConfigRepository extends JpaRepository<RateConfig, Long> {
    
    List<RateConfig> findByParkingLotId(Long parkingLotId);
    
    List<RateConfig> findByParkingLotIdAndStatus(Long parkingLotId, String status);
    
    List<RateConfig> findByParkingLotIdIsNullAndStatus(String status);
}
