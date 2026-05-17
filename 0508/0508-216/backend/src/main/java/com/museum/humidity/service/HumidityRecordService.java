package com.museum.humidity.service;

import com.museum.humidity.entity.HumidityRecord;
import com.museum.humidity.repository.HumidityRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class HumidityRecordService {
    @Autowired
    private HumidityRecordRepository recordRepository;

    @Autowired
    private DisplayCabinetService cabinetService;

    public HumidityRecord addRecord(Long deviceId, Double humidity) {
        HumidityRecord record = new HumidityRecord();
        record.setDeviceId(deviceId);
        record.setHumidity(humidity);
        record.setTimestamp(LocalDateTime.now());

        cabinetService.updateCurrentHumidity(deviceId, humidity);

        return recordRepository.save(record);
    }

    public List<HumidityRecord> getRecordsByDeviceId(Long deviceId) {
        return recordRepository.findByDeviceIdOrderByTimestampDesc(deviceId);
    }

    public List<HumidityRecord> getRecordsByDeviceIdAndTimeRange(Long deviceId, LocalDateTime start, LocalDateTime end) {
        return recordRepository.findByDeviceIdAndTimestampBetweenOrderByTimestampAsc(deviceId, start, end);
    }

    public List<HumidityRecord> getRecentRecords(Long deviceId, int limit) {
        return recordRepository.findTop20ByDeviceIdOrderByTimestampDesc(deviceId);
    }
}
