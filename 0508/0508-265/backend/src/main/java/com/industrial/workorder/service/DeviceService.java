package com.industrial.workorder.service;

import com.industrial.workorder.entity.Device;
import com.industrial.workorder.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DeviceService {

    @Autowired
    private DeviceRepository deviceRepository;

    public List<Device> findAll() {
        return deviceRepository.findAll();
    }

    public Optional<Device> findById(Long id) {
        return deviceRepository.findById(id);
    }

    public Optional<Device> findByDeviceCode(String deviceCode) {
        return deviceRepository.findByDeviceCode(deviceCode);
    }

    public List<Device> findByProductionLine(String productionLine) {
        return deviceRepository.findByProductionLine(productionLine);
    }

    public List<Device> findByStatus(String status) {
        return deviceRepository.findByStatus(status);
    }

    public Device save(Device device) {
        return deviceRepository.save(device);
    }

    public void deleteById(Long id) {
        deviceRepository.deleteById(id);
    }

    public Device updateStatus(Long id, String status) {
        Optional<Device> deviceOpt = deviceRepository.findById(id);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            device.setStatus(status);
            return deviceRepository.save(device);
        }
        return null;
    }
}
