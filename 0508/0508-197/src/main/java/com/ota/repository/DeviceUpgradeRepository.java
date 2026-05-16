package com.ota.repository;

import com.ota.entity.DeviceUpgrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeviceUpgradeRepository extends JpaRepository<DeviceUpgrade, Long> {
    
    List<DeviceUpgrade> findAllByOrderByStartTimeDesc();
    
    List<DeviceUpgrade> findByDeviceIdOrderByStartTimeDesc(String deviceId);
    
    List<DeviceUpgrade> findByDeviceModel(String deviceModel);
    
    List<DeviceUpgrade> findByStatus(String status);
    
    @Query("SELECT d.deviceModel, d.status, COUNT(d) FROM DeviceUpgrade d GROUP BY d.deviceModel, d.status")
    List<Object[]> countByDeviceModelAndStatus();
    
    @Query("SELECT d.targetVersion, COUNT(d) FROM DeviceUpgrade d WHERE d.status = 'SUCCESS' GROUP BY d.targetVersion")
    List<Object[]> countBySuccessVersion();
}
