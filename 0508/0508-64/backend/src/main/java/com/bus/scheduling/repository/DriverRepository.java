package com.bus.scheduling.repository;

import com.bus.scheduling.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByDriverNumber(String driverNumber);
    List<Driver> findAllByOrderByIdAsc();
}
