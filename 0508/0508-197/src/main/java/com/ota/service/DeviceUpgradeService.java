package com.ota.service;

import com.ota.entity.DeviceUpgrade;
import com.ota.entity.Firmware;
import com.ota.repository.DeviceUpgradeRepository;
import com.ota.repository.FirmwareRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class DeviceUpgradeService {
    
    @Autowired
    private DeviceUpgradeRepository deviceUpgradeRepository;
    
    @Autowired
    private FirmwareRepository firmwareRepository;
    
    public Map<String, Object> checkForUpgrade(String deviceId, String deviceModel, String currentVersion) {
        Map<String, Object> result = new HashMap<>();
        
        Optional<Firmware> latestFirmwareOpt = firmwareRepository
            .findFirstByDeviceModelOrderByReleaseTimeDesc(deviceModel);
        
        if (!latestFirmwareOpt.isPresent()) {
            result.put("upgradeAvailable", false);
            return result;
        }
        
        Firmware latestFirmware = latestFirmwareOpt.get();
        
        if (isNewerVersion(latestFirmware.getVersion(), currentVersion)) {
            result.put("upgradeAvailable", true);
            result.put("version", latestFirmware.getVersion());
            result.put("description", latestFirmware.getDescription());
            result.put("downloadUrl", latestFirmware.getDownloadUrl());
            result.put("fileSize", latestFirmware.getFileSize());
            result.put("releaseTime", latestFirmware.getReleaseTime());
            
            DeviceUpgrade upgrade = new DeviceUpgrade();
            upgrade.setDeviceId(deviceId);
            upgrade.setDeviceModel(deviceModel);
            upgrade.setCurrentVersion(currentVersion);
            upgrade.setTargetVersion(latestFirmware.getVersion());
            upgrade.setStatus("DOWNLOADING");
            upgrade.setStartTime(LocalDateTime.now());
            deviceUpgradeRepository.save(upgrade);
            
            result.put("upgradeId", upgrade.getId());
        } else {
            result.put("upgradeAvailable", false);
        }
        
        return result;
    }
    
    public DeviceUpgrade reportUpgradeResult(Long upgradeId, boolean success, String failureReason) {
        Optional<DeviceUpgrade> upgradeOpt = deviceUpgradeRepository.findById(upgradeId);
        
        if (!upgradeOpt.isPresent()) {
            return null;
        }
        
        DeviceUpgrade upgrade = upgradeOpt.get();
        upgrade.setStatus(success ? "SUCCESS" : "FAILED");
        upgrade.setCompleteTime(LocalDateTime.now());
        if (!success && failureReason != null) {
            upgrade.setFailureReason(failureReason);
        }
        
        return deviceUpgradeRepository.save(upgrade);
    }
    
    public List<DeviceUpgrade> getAllUpgrades() {
        return deviceUpgradeRepository.findAllByOrderByStartTimeDesc();
    }
    
    public List<DeviceUpgrade> getUpgradesByDevice(String deviceId) {
        return deviceUpgradeRepository.findByDeviceIdOrderByStartTimeDesc(deviceId);
    }
    
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        List<Object[]> modelStatusCount = deviceUpgradeRepository.countByDeviceModelAndStatus();
        List<Object[]> versionCount = deviceUpgradeRepository.countBySuccessVersion();
        
        Map<String, Map<String, Long>> modelStats = new HashMap<>();
        for (Object[] row : modelStatusCount) {
            String model = (String) row[0];
            String status = (String) row[1];
            Long count = (Long) row[2];
            
            modelStats.computeIfAbsent(model, k -> new HashMap<>()).put(status, count);
        }
        
        Map<String, Double> successRates = new HashMap<>();
        for (Map.Entry<String, Map<String, Long>> entry : modelStats.entrySet()) {
            Map<String, Long> statusMap = entry.getValue();
            long success = statusMap.getOrDefault("SUCCESS", 0L);
            long failed = statusMap.getOrDefault("FAILED", 0L);
            long total = success + failed;
            double rate = total > 0 ? (success * 100.0 / total) : 0;
            successRates.put(entry.getKey(), rate);
        }
        
        Map<String, Long> versionDistribution = new HashMap<>();
        for (Object[] row : versionCount) {
            versionDistribution.put((String) row[0], (Long) row[1]);
        }
        
        stats.put("modelStats", modelStats);
        stats.put("successRates", successRates);
        stats.put("versionDistribution", versionDistribution);
        
        return stats;
    }
    
    private boolean isNewerVersion(String newVersion, String oldVersion) {
        String[] newParts = newVersion.split("\\.");
        String[] oldParts = oldVersion.split("\\.");
        
        int maxLength = Math.max(newParts.length, oldParts.length);
        
        for (int i = 0; i < maxLength; i++) {
            int newNum = i < newParts.length ? Integer.parseInt(newParts[i]) : 0;
            int oldNum = i < oldParts.length ? Integer.parseInt(oldParts[i]) : 0;
            
            if (newNum > oldNum) {
                return true;
            } else if (newNum < oldNum) {
                return false;
            }
        }
        
        return false;
    }
}
