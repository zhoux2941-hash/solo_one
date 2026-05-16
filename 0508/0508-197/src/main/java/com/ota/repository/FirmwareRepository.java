package com.ota.repository;

import com.ota.entity.Firmware;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FirmwareRepository extends JpaRepository<Firmware, Long> {
    
    List<Firmware> findByDeviceModelOrderByReleaseTimeDesc(String deviceModel);
    
    Optional<Firmware> findFirstByDeviceModelOrderByReleaseTimeDesc(String deviceModel);
    
    Optional<Firmware> findByDeviceModelAndVersion(String deviceModel, String version);
    
    List<Firmware> findAllByOrderByReleaseTimeDesc();
}
