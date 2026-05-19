package com.industrial.workorder.repository;

import com.industrial.workorder.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {
    Optional<Device> findByDeviceCode(String deviceCode);
    List<Device> findByProductionLine(String productionLine);
    List<Device> findByStatus(String status);
    List<Device> findByDeviceType(String deviceType);
}
