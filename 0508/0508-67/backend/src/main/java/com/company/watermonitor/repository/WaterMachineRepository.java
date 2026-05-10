package com.company.watermonitor.repository;

import com.company.watermonitor.entity.WaterMachine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WaterMachineRepository extends JpaRepository<WaterMachine, Long> {
    
    List<WaterMachine> findByFloor(Integer floor);
    
    List<WaterMachine> findByFloorIn(List<Integer> floors);
}
