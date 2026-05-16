package com.ota.service;

import com.ota.entity.Firmware;
import com.ota.repository.FirmwareRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FirmwareService {
    
    @Autowired
    private FirmwareRepository firmwareRepository;
    
    public Firmware uploadFirmware(MultipartFile file, String version, String deviceModel, 
                                   String description) {
        Firmware firmware = new Firmware();
        firmware.setVersion(version);
        firmware.setDeviceModel(deviceModel);
        firmware.setDescription(description);
        firmware.setReleaseTime(LocalDateTime.now());
        firmware.setFileName(file.getOriginalFilename());
        firmware.setFileSize(formatFileSize(file.getSize()));
        firmware.setDownloadUrl("/api/firmware/download/" + version);
        
        return firmwareRepository.save(firmware);
    }
    
    public Firmware uploadFirmwareMock(String version, String deviceModel, 
                                       String description, String fileName, long fileSize) {
        Firmware firmware = new Firmware();
        firmware.setVersion(version);
        firmware.setDeviceModel(deviceModel);
        firmware.setDescription(description);
        firmware.setReleaseTime(LocalDateTime.now());
        firmware.setFileName(fileName);
        firmware.setFileSize(formatFileSize(fileSize));
        firmware.setDownloadUrl("/api/firmware/download/" + version);
        
        return firmwareRepository.save(firmware);
    }
    
    public List<Firmware> getAllFirmware() {
        return firmwareRepository.findAllByOrderByReleaseTimeDesc();
    }
    
    public List<Firmware> getFirmwareByModel(String deviceModel) {
        return firmwareRepository.findByDeviceModelOrderByReleaseTimeDesc(deviceModel);
    }
    
    public Optional<Firmware> getLatestFirmware(String deviceModel) {
        return firmwareRepository.findFirstByDeviceModelOrderByReleaseTimeDesc(deviceModel);
    }
    
    public void deleteFirmware(Long id) {
        firmwareRepository.deleteById(id);
    }
    
    private String formatFileSize(long size) {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.2f KB", size / 1024.0);
        return String.format("%.2f MB", size / (1024.0 * 1024.0));
    }
}
