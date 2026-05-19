package com.autorepair.repository;

import com.autorepair.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByCustomerId(Long customerId);
    List<Vehicle> findByPlateNumberContainingOrVinContaining(String plateNumber, String vin);
}