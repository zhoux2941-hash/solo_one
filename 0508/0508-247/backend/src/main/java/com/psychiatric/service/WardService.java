package com.psychiatric.service;

import com.psychiatric.entity.UnlockRecord;
import com.psychiatric.entity.Ward;
import com.psychiatric.repository.UnlockRecordRepository;
import com.psychiatric.repository.WardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WardService {
    
    @Autowired
    private WardRepository wardRepository;
    
    @Autowired
    private UnlockRecordRepository unlockRecordRepository;
    
    public List<Ward> getAllWards() {
        return wardRepository.findAll();
    }
    
    public Optional<Ward> getWardByNumber(String wardNumber) {
        return wardRepository.findByWardNumber(wardNumber);
    }
    
    public Ward saveWard(Ward ward) {
        return wardRepository.save(ward);
    }
    
    public Ward unlockDoor(String wardNumber, String operator, String reason) {
        Optional<Ward> wardOpt = wardRepository.findByWardNumber(wardNumber);
        if (wardOpt.isPresent()) {
            Ward ward = wardOpt.get();
            ward.setDoorLocked(false);
            ward.setCurrentUnlocker(operator);
            ward.setUnlockReason(reason);
            wardRepository.save(ward);
            
            UnlockRecord record = new UnlockRecord();
            record.setWardNumber(wardNumber);
            record.setOperator(operator);
            record.setReason(reason);
            record.setUnlockTime(LocalDateTime.now());
            unlockRecordRepository.save(record);
            
            return ward;
        }
        return null;
    }
    
    public Ward lockDoor(String wardNumber) {
        Optional<Ward> wardOpt = wardRepository.findByWardNumber(wardNumber);
        if (wardOpt.isPresent()) {
            Ward ward = wardOpt.get();
            ward.setDoorLocked(true);
            ward.setCurrentUnlocker(null);
            ward.setUnlockReason(null);
            return wardRepository.save(ward);
        }
        return null;
    }
}
