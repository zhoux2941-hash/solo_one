package com.psychiatric.service;

import com.psychiatric.entity.LocationRecord;
import com.psychiatric.entity.Patient;
import com.psychiatric.repository.LocationRecordRepository;
import com.psychiatric.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class LocationRecordService {
    
    @Autowired
    private LocationRecordRepository locationRecordRepository;
    
    @Autowired
    private PatientRepository patientRepository;
    
    private static final LocalTime NIGHT_START = LocalTime.of(23, 0);
    private static final LocalTime NIGHT_END = LocalTime.of(6, 0);
    
    public List<LocationRecord> getAllRecords() {
        return locationRecordRepository.findAll();
    }
    
    public List<LocationRecord> getRecordsByBraceletId(String braceletId) {
        return locationRecordRepository.findByBraceletIdOrderByRecordTimeDesc(braceletId);
    }
    
    public LocationRecord addRecord(String braceletId, String location) {
        Patient patient = patientRepository.findByBraceletId(braceletId).orElse(null);
        if (patient == null) {
            return null;
        }
        
        LocalDateTime now = LocalDateTime.now();
        boolean isNightTime = isNightTime(now);
        
        LocationRecord record = new LocationRecord();
        record.setBraceletId(braceletId);
        record.setPatientName(patient.getName());
        record.setLocation(location);
        record.setRecordTime(now);
        record.setIsNightTime(isNightTime);
        
        patient.setCurrentLocation(location);
        patientRepository.save(patient);
        
        return locationRecordRepository.save(record);
    }
    
    public long countNightCorridorActivity(String braceletId, LocalDateTime startTime, LocalDateTime endTime) {
        return locationRecordRepository.countNightCorridorActivity(braceletId, startTime, endTime);
    }
    
    public List<String> getAllBraceletIdsWithNightActivity() {
        return locationRecordRepository.findAllBraceletIdsWithNightActivity();
    }
    
    private boolean isNightTime(LocalDateTime dateTime) {
        LocalTime time = dateTime.toLocalTime();
        return time.isAfter(NIGHT_START) || time.isBefore(NIGHT_END);
    }
}
