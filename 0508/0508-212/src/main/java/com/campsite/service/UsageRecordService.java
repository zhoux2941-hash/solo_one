package com.campsite.service;

import com.campsite.entity.UsageRecord;
import com.campsite.repository.UsageRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UsageRecordService {

    @Autowired
    private UsageRecordRepository usageRecordRepository;

    public List<UsageRecord> findAll() {
        return usageRecordRepository.findAll();
    }

    public Page<UsageRecord> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return usageRecordRepository.findAll(pageable);
    }

    public Optional<UsageRecord> findById(Long id) {
        return usageRecordRepository.findById(id);
    }

    public List<UsageRecord> findByRecordType(String recordType) {
        return usageRecordRepository.findByRecordType(recordType);
    }

    public Page<UsageRecord> findByRecordType(String recordType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return usageRecordRepository.findByRecordType(recordType, pageable);
    }

    public List<UsageRecord> findByAreaId(Long areaId) {
        return usageRecordRepository.findByAreaId(areaId);
    }

    public List<UsageRecord> findByMaintenanceStatus(String maintenanceStatus) {
        return usageRecordRepository.findByMaintenanceStatus(maintenanceStatus);
    }

    public Page<UsageRecord> findByMaintenanceStatus(String maintenanceStatus, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        return usageRecordRepository.findByMaintenanceStatus(maintenanceStatus, pageable);
    }

    public UsageRecord save(UsageRecord usageRecord) {
        return usageRecordRepository.save(usageRecord);
    }

    public void deleteById(Long id) {
        usageRecordRepository.deleteById(id);
    }

    public UsageRecord update(Long id, UsageRecord usageRecord) {
        Optional<UsageRecord> existingOpt = usageRecordRepository.findById(id);
        if (existingOpt.isPresent()) {
            UsageRecord existing = existingOpt.get();
            existing.setRecordType(usageRecord.getRecordType());
            existing.setAreaId(usageRecord.getAreaId());
            existing.setCampRecordId(usageRecord.getCampRecordId());
            existing.setStartTime(usageRecord.getStartTime());
            existing.setEndTime(usageRecord.getEndTime());
            existing.setDurationHours(usageRecord.getDurationHours());
            existing.setMaintenanceStatus(usageRecord.getMaintenanceStatus());
            existing.setMaintenanceNotes(usageRecord.getMaintenanceNotes());
            existing.setMaintenancePerson(usageRecord.getMaintenancePerson());
            existing.setMaintenanceDate(usageRecord.getMaintenanceDate());
            existing.setNotes(usageRecord.getNotes());
            return usageRecordRepository.save(existing);
        }
        return null;
    }
}
