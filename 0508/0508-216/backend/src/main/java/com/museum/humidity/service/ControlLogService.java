package com.museum.humidity.service;

import com.museum.humidity.entity.ControlLog;
import com.museum.humidity.entity.ControlType;
import com.museum.humidity.repository.ControlLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ControlLogService {
    @Autowired
    private ControlLogRepository logRepository;

    public ControlLog addLog(Long deviceId, ControlType controlType, String message,
                              Double humidityBefore, Double humidityAfter, Double energyConsumption) {
        ControlLog log = new ControlLog();
        log.setDeviceId(deviceId);
        log.setControlType(controlType);
        log.setMessage(message);
        log.setHumidityBefore(humidityBefore);
        log.setHumidityAfter(humidityAfter);
        log.setEnergyConsumption(energyConsumption);
        log.setTimestamp(LocalDateTime.now());
        return logRepository.save(log);
    }

    public List<ControlLog> getLogsByDeviceId(Long deviceId) {
        return logRepository.findByDeviceIdOrderByTimestampDesc(deviceId);
    }

    public List<ControlLog> getRecentLogs(Long deviceId, int limit) {
        return logRepository.findTop10ByDeviceIdOrderByTimestampDesc(deviceId);
    }

    public List<ControlLog> getLogsByDeviceIdAndTimeRange(Long deviceId, LocalDateTime start, LocalDateTime end) {
        return logRepository.findByDeviceIdAndTimestampBetweenOrderByTimestampAsc(deviceId, start, end);
    }

    public Double getHumidifyEnergyConsumption(Long deviceId, LocalDateTime start, LocalDateTime end) {
        return logRepository.sumHumidifyEnergyByDeviceIdAndTimeRange(deviceId, start, end);
    }

    public Double getDehumidifyEnergyConsumption(Long deviceId, LocalDateTime start, LocalDateTime end) {
        return logRepository.sumDehumidifyEnergyByDeviceIdAndTimeRange(deviceId, start, end);
    }
}
