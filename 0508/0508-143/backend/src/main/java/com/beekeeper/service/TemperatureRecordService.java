package com.beekeeper.service;

import com.beekeeper.dto.TemperatureRecordDTO;
import com.beekeeper.entity.TemperatureRecord;
import com.beekeeper.repository.TemperatureRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TemperatureRecordService {
    
    private final TemperatureRecordRepository temperatureRecordRepository;
    
    @Transactional
    public TemperatureRecord createTemperatureRecord(TemperatureRecordDTO dto) {
        if (temperatureRecordRepository.existsByRecordDate(dto.getRecordDate())) {
            throw new RuntimeException("该日期已有温度记录");
        }
        
        TemperatureRecord record = new TemperatureRecord();
        record.setRecordDate(dto.getRecordDate());
        record.setMaxTemperature(dto.getMaxTemperature());
        record.setMinTemperature(dto.getMinTemperature());
        
        if (dto.getAvgTemperature() != null) {
            record.setAvgTemperature(dto.getAvgTemperature());
        } else {
            record.setAvgTemperature((dto.getMaxTemperature() + dto.getMinTemperature()) / 2.0);
        }
        
        record.setLocation(dto.getLocation());
        record.setCreatedAt(LocalDateTime.now());
        
        return temperatureRecordRepository.save(record);
    }
    
    @Transactional
    public TemperatureRecord updateTemperatureRecord(Long id, TemperatureRecordDTO dto) {
        TemperatureRecord record = temperatureRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("温度记录不存在"));
        
        if (!record.getRecordDate().equals(dto.getRecordDate())
                && temperatureRecordRepository.existsByRecordDate(dto.getRecordDate())) {
            throw new RuntimeException("该日期已有温度记录");
        }
        
        record.setRecordDate(dto.getRecordDate());
        record.setMaxTemperature(dto.getMaxTemperature());
        record.setMinTemperature(dto.getMinTemperature());
        
        if (dto.getAvgTemperature() != null) {
            record.setAvgTemperature(dto.getAvgTemperature());
        } else {
            record.setAvgTemperature((dto.getMaxTemperature() + dto.getMinTemperature()) / 2.0);
        }
        
        record.setLocation(dto.getLocation());
        
        return temperatureRecordRepository.save(record);
    }
    
    @Transactional
    public void deleteTemperatureRecord(Long id) {
        if (!temperatureRecordRepository.existsById(id)) {
            throw new RuntimeException("温度记录不存在");
        }
        temperatureRecordRepository.deleteById(id);
    }
    
    public List<TemperatureRecord> getTemperatureRecordsByDateRange(LocalDate startDate, LocalDate endDate) {
        return temperatureRecordRepository.findByRecordDateBetween(startDate, endDate);
    }
    
    public TemperatureRecord getTemperatureRecordByDate(LocalDate date) {
        return temperatureRecordRepository.findByRecordDate(date).orElse(null);
    }
    
    @Transactional
    public List<TemperatureRecord> batchCreateTemperatureRecords(List<TemperatureRecordDTO> dtos) {
        List<TemperatureRecord> records = new java.util.ArrayList<>();
        
        for (TemperatureRecordDTO dto : dtos) {
            if (!temperatureRecordRepository.existsByRecordDate(dto.getRecordDate())) {
                TemperatureRecord record = new TemperatureRecord();
                record.setRecordDate(dto.getRecordDate());
                record.setMaxTemperature(dto.getMaxTemperature());
                record.setMinTemperature(dto.getMinTemperature());
                record.setAvgTemperature(dto.getAvgTemperature() != null 
                        ? dto.getAvgTemperature() 
                        : (dto.getMaxTemperature() + dto.getMinTemperature()) / 2.0);
                record.setLocation(dto.getLocation());
                record.setCreatedAt(LocalDateTime.now());
                records.add(record);
            }
        }
        
        return temperatureRecordRepository.saveAll(records);
    }
    
    @Transactional
    public TemperatureRecord upsertTemperatureRecord(TemperatureRecordDTO dto) {
        TemperatureRecord existing = temperatureRecordRepository.findByRecordDate(dto.getRecordDate()).orElse(null);
        
        if (existing != null) {
            existing.setMaxTemperature(dto.getMaxTemperature());
            existing.setMinTemperature(dto.getMinTemperature());
            existing.setAvgTemperature(dto.getAvgTemperature() != null 
                    ? dto.getAvgTemperature() 
                    : (dto.getMaxTemperature() + dto.getMinTemperature()) / 2.0);
            existing.setLocation(dto.getLocation());
            return temperatureRecordRepository.save(existing);
        } else {
            return createTemperatureRecord(dto);
        }
    }
}
