package com.guqin.tuner.service;

import com.guqin.tuner.entity.HuiPositionDetail;
import com.guqin.tuner.entity.HuiPositionDetailDTO;
import com.guqin.tuner.entity.TuningRecord;
import com.guqin.tuner.entity.TuningRecordCreateDTO;
import com.guqin.tuner.mapper.HuiPositionDetailRepository;
import com.guqin.tuner.mapper.TuningRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TuningRecordService {

    @Autowired
    private TuningRecordRepository tuningRecordRepository;

    @Autowired
    private HuiPositionDetailRepository huiPositionDetailRepository;

    @Cacheable(value = "tuningRecord", key = "'guqin_' + #guqinId")
    public List<TuningRecord> getRecordsByGuqinId(Long guqinId) {
        return tuningRecordRepository.findByGuqinIdOrderByRecordTimeDesc(guqinId);
    }

    @Cacheable(value = "tuningRecordDetail", key = "#id")
    public Map<String, Object> getRecordWithDetails(Long id) {
        Optional<TuningRecord> recordOpt = tuningRecordRepository.findById(id);
        if (recordOpt.isEmpty()) {
            return null;
        }
        
        TuningRecord record = recordOpt.get();
        List<HuiPositionDetail> details = huiPositionDetailRepository.findByTuningRecordIdOrderByHuiNumber(id);
        
        Map<String, Object> result = new HashMap<>();
        result.put("record", record);
        result.put("details", details);
        
        return result;
    }

    @Transactional
    @CacheEvict(value = {"tuningRecord", "tuningRecordDetail", "comparison"}, allEntries = true)
    public Map<String, Object> createTuningRecord(TuningRecordCreateDTO dto) {
        // 创建调音记录
        TuningRecord record = new TuningRecord();
        record.setGuqinId(dto.getGuqinId());
        record.setRecordTime(dto.getRecordTime());
        record.setNotes(dto.getNotes());
        
        TuningRecord savedRecord = tuningRecordRepository.save(record);
        
        // 保存徽位音准详情
        List<HuiPositionDetail> savedDetails = new ArrayList<>();
        if (dto.getHuiDetails() != null && !dto.getHuiDetails().isEmpty()) {
            for (HuiPositionDetailDTO detailDTO : dto.getHuiDetails()) {
                HuiPositionDetail detail = new HuiPositionDetail();
                detail.setTuningRecordId(savedRecord.getId());
                detail.setHuiNumber(detailDTO.getHuiNumber());
                detail.setTheoreticalFrequency(detailDTO.getTheoreticalFrequency());
                detail.setMeasuredFrequency(detailDTO.getMeasuredFrequency());
                detail.setCentDeviation(detailDTO.getCentDeviation());
                savedDetails.add(huiPositionDetailRepository.save(detail));
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("record", savedRecord);
        result.put("details", savedDetails);
        
        return result;
    }

    @Transactional
    @CacheEvict(value = {"tuningRecord", "tuningRecordDetail", "comparison"}, allEntries = true)
    public boolean deleteTuningRecord(Long id) {
        if (tuningRecordRepository.existsById(id)) {
            // 先删除关联的徽位详情
            List<HuiPositionDetail> details = huiPositionDetailRepository.findByTuningRecordIdOrderByHuiNumber(id);
            huiPositionDetailRepository.deleteAll(details);
            // 再删除记录
            tuningRecordRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // 获取某张琴最新的音准偏差曲线
    public Map<String, Object> getLatestCurve(Long guqinId) {
        List<TuningRecord> records = tuningRecordRepository.findByGuqinIdOrderByRecordTimeDesc(guqinId);
        if (records.isEmpty()) {
            return null;
        }
        
        TuningRecord latestRecord = records.get(0);
        List<HuiPositionDetail> details = huiPositionDetailRepository.findByTuningRecordIdOrderByHuiNumber(latestRecord.getId());
        
        Map<String, Object> curve = new HashMap<>();
        curve.put("record", latestRecord);
        
        // 构建音准偏差曲线数据
        List<Map<String, Object>> curveData = details.stream().map(detail -> {
            Map<String, Object> point = new HashMap<>();
            point.put("huiNumber", detail.getHuiNumber());
            point.put("centDeviation", detail.getCentDeviation());
            point.put("theoreticalFrequency", detail.getTheoreticalFrequency());
            point.put("measuredFrequency", detail.getMeasuredFrequency());
            return point;
        }).collect(Collectors.toList());
        
        curve.put("curveData", curveData);
        
        return curve;
    }
}
