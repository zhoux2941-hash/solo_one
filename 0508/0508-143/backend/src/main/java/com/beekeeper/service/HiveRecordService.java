package com.beekeeper.service;

import com.beekeeper.dto.HiveRecordDTO;
import com.beekeeper.entity.Beehive;
import com.beekeeper.entity.HiveRecord;
import com.beekeeper.repository.BeehiveRepository;
import com.beekeeper.repository.HiveRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HiveRecordService {
    
    private final HiveRecordRepository hiveRecordRepository;
    private final BeehiveRepository beehiveRepository;
    
    @Transactional
    @CacheEvict(value = {"hiveRecords", "healthScores"}, allEntries = true)
    public HiveRecord createRecord(HiveRecordDTO dto) {
        Beehive beehive = beehiveRepository.findById(dto.getBeehiveId())
                .orElseThrow(() -> new RuntimeException("蜂箱不存在"));
        
        if (hiveRecordRepository.existsByBeehiveIdAndRecordDate(dto.getBeehiveId(), dto.getRecordDate())) {
            throw new RuntimeException("该日期已有记录");
        }
        
        HiveRecord record = new HiveRecord();
        record.setBeehive(beehive);
        record.setRecordDate(dto.getRecordDate());
        record.setMorningTemperature(dto.getMorningTemperature());
        record.setEveningTemperature(dto.getEveningTemperature());
        record.setMorningHumidity(dto.getMorningHumidity());
        record.setEveningHumidity(dto.getEveningHumidity());
        record.setActivityLevel(dto.getActivityLevel());
        record.setOutsideTemperature(dto.getOutsideTemperature());
        record.setOutsideHumidity(dto.getOutsideHumidity());
        record.setNotes(dto.getNotes());
        
        return hiveRecordRepository.save(record);
    }
    
    @Transactional
    @CacheEvict(value = {"hiveRecords", "healthScores"}, allEntries = true)
    public HiveRecord updateRecord(Long id, HiveRecordDTO dto) {
        HiveRecord record = hiveRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("记录不存在"));
        
        Beehive beehive = beehiveRepository.findById(dto.getBeehiveId())
                .orElseThrow(() -> new RuntimeException("蜂箱不存在"));
        
        if (!record.getRecordDate().equals(dto.getRecordDate())
                && hiveRecordRepository.existsByBeehiveIdAndRecordDate(dto.getBeehiveId(), dto.getRecordDate())) {
            throw new RuntimeException("该日期已有记录");
        }
        
        record.setBeehive(beehive);
        record.setRecordDate(dto.getRecordDate());
        record.setMorningTemperature(dto.getMorningTemperature());
        record.setEveningTemperature(dto.getEveningTemperature());
        record.setMorningHumidity(dto.getMorningHumidity());
        record.setEveningHumidity(dto.getEveningHumidity());
        record.setActivityLevel(dto.getActivityLevel());
        record.setOutsideTemperature(dto.getOutsideTemperature());
        record.setOutsideHumidity(dto.getOutsideHumidity());
        record.setNotes(dto.getNotes());
        
        return hiveRecordRepository.save(record);
    }
    
    @Transactional
    @CacheEvict(value = {"hiveRecords", "healthScores"}, allEntries = true)
    public void deleteRecord(Long id) {
        if (!hiveRecordRepository.existsById(id)) {
            throw new RuntimeException("记录不存在");
        }
        hiveRecordRepository.deleteById(id);
    }
    
    @Cacheable(value = "hiveRecords", key = "#beehiveId")
    public List<HiveRecord> getRecordsByBeehive(Long beehiveId) {
        return hiveRecordRepository.findByBeehiveIdOrderByRecordDateDesc(beehiveId);
    }
    
    @Cacheable(value = "hiveRecords", key = "#beehiveId + '-' + #startDate + '-' + #endDate")
    public List<HiveRecord> getRecordsByBeehiveAndDateRange(Long beehiveId, LocalDate startDate, LocalDate endDate) {
        return hiveRecordRepository.findByBeehiveIdAndRecordDateBetween(beehiveId, startDate, endDate);
    }
    
    public List<HiveRecord> getRecordsForComparison(List<Long> beehiveIds, LocalDate startDate, LocalDate endDate) {
        return hiveRecordRepository.findByBeehiveIdsAndRecordDateBetween(beehiveIds, startDate, endDate);
    }
    
    @Cacheable(value = "hiveRecords", key = "'today-' + #beehiveId")
    public HiveRecord getTodayRecord(Long beehiveId) {
        return hiveRecordRepository.findByBeehiveIdAndRecordDate(beehiveId, LocalDate.now()).orElse(null);
    }
}
