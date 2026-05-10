package com.guqin.tuner.service;

import com.guqin.tuner.entity.Guqin;
import com.guqin.tuner.entity.HuiPositionDetail;
import com.guqin.tuner.entity.TuningRecord;
import com.guqin.tuner.mapper.GuqinRepository;
import com.guqin.tuner.mapper.HuiPositionDetailRepository;
import com.guqin.tuner.mapper.TuningRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ComparisonService {

    @Autowired
    private GuqinRepository guqinRepository;

    @Autowired
    private TuningRecordRepository tuningRecordRepository;

    @Autowired
    private HuiPositionDetailRepository huiPositionDetailRepository;

    @Cacheable(value = "comparison", key = "'compare_' + #guqinIds.hashCode()")
    public List<Map<String, Object>> compareInstruments(List<Long> guqinIds) {
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (Long guqinId : guqinIds) {
            Optional<Guqin> guqinOpt = guqinRepository.findById(guqinId);
            if (guqinOpt.isEmpty()) {
                continue;
            }
            
            Guqin guqin = guqinOpt.get();
            List<TuningRecord> records = tuningRecordRepository.findByGuqinIdOrderByRecordTimeDesc(guqinId);
            
            if (records.isEmpty()) {
                Map<String, Object> noData = new HashMap<>();
                noData.put("guqinId", guqinId);
                noData.put("guqinName", guqin.getName());
                noData.put("hasData", false);
                results.add(noData);
                continue;
            }
            
            // 获取最新的记录
            TuningRecord latestRecord = records.get(0);
            List<HuiPositionDetail> details = huiPositionDetailRepository.findByTuningRecordIdOrderByHuiNumber(latestRecord.getId());
            
            // 构建曲线数据
            List<Map<String, Object>> curveData = details.stream().map(detail -> {
                Map<String, Object> point = new HashMap<>();
                point.put("huiNumber", detail.getHuiNumber());
                point.put("centDeviation", detail.getCentDeviation());
                return point;
            }).collect(Collectors.toList());
            
            // 计算统计数据
            Map<String, Object> stats = calculateStatistics(details);
            
            Map<String, Object> result = new HashMap<>();
            result.put("guqinId", guqinId);
            result.put("guqinName", guqin.getName());
            result.put("stringLength", guqin.getStringLength());
            result.put("recordTime", latestRecord.getRecordTime());
            result.put("hasData", true);
            result.put("curveData", curveData);
            result.put("statistics", stats);
            
            results.add(result);
        }
        
        return results;
    }

    @Cacheable(value = "comparison", key = "'history_' + #guqinId")
    public List<Map<String, Object>> getHistoryCurve(Long guqinId) {
        List<TuningRecord> records = tuningRecordRepository.findByGuqinIdOrderByRecordTimeDesc(guqinId);
        List<Map<String, Object>> history = new ArrayList<>();
        
        for (TuningRecord record : records) {
            List<HuiPositionDetail> details = huiPositionDetailRepository.findByTuningRecordIdOrderByHuiNumber(record.getId());
            
            List<Map<String, Object>> curveData = details.stream().map(detail -> {
                Map<String, Object> point = new HashMap<>();
                point.put("huiNumber", detail.getHuiNumber());
                point.put("centDeviation", detail.getCentDeviation());
                return point;
            }).collect(Collectors.toList());
            
            Map<String, Object> recordData = new HashMap<>();
            recordData.put("recordId", record.getId());
            recordData.put("recordTime", record.getRecordTime());
            recordData.put("notes", record.getNotes());
            recordData.put("curveData", curveData);
            
            history.add(recordData);
        }
        
        return history;
    }

    @Cacheable(value = "comparison", key = "'stats_' + #guqinId")
    public Map<String, Object> getStatistics(Long guqinId) {
        List<TuningRecord> records = tuningRecordRepository.findByGuqinIdOrderByRecordTimeDesc(guqinId);
        if (records.isEmpty()) {
            return null;
        }
        
        // 获取所有记录的所有徽位详情
        List<Long> recordIds = records.stream().map(TuningRecord::getId).collect(Collectors.toList());
        List<HuiPositionDetail> allDetails = huiPositionDetailRepository.findByTuningRecordIdIn(recordIds);
        
        // 按徽位分组统计
        Map<Integer, List<BigDecimal>> deviationsByHui = allDetails.stream()
            .collect(Collectors.groupingBy(
                HuiPositionDetail::getHuiNumber,
                Collectors.mapping(HuiPositionDetail::getCentDeviation, Collectors.toList())
            ));
        
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> huiStatistics = new ArrayList<>();
        
        for (Map.Entry<Integer, List<BigDecimal>> entry : deviationsByHui.entrySet()) {
            List<BigDecimal> deviations = entry.getValue();
            
            if (deviations.isEmpty()) continue;
            
            // 计算统计指标
            BigDecimal sum = deviations.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal average = sum.divide(new BigDecimal(deviations.size()), 4, RoundingMode.HALF_UP);
            
            Collections.sort(deviations);
            BigDecimal min = deviations.get(0);
            BigDecimal max = deviations.get(deviations.size() - 1);
            BigDecimal median = deviations.get(deviations.size() / 2);
            
            // 计算标准差
            BigDecimal varianceSum = deviations.stream()
                .map(d -> d.subtract(average).pow(2))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal variance = varianceSum.divide(new BigDecimal(deviations.size()), 4, RoundingMode.HALF_UP);
            BigDecimal stdDev = new BigDecimal(Math.sqrt(variance.doubleValue()));
            
            Map<String, Object> huiStat = new HashMap<>();
            huiStat.put("huiNumber", entry.getKey());
            huiStat.put("average", average);
            huiStat.put("median", median);
            huiStat.put("min", min);
            huiStat.put("max", max);
            huiStat.put("stdDev", stdDev.setScale(4, RoundingMode.HALF_UP));
            huiStat.put("sampleCount", deviations.size());
            
            huiStatistics.add(huiStat);
        }
        
        // 按徽位排序
        huiStatistics.sort(Comparator.comparingInt(m -> (Integer) m.get("huiNumber")));
        
        result.put("recordCount", records.size());
        result.put("huiStatistics", huiStatistics);
        
        return result;
    }

    private Map<String, Object> calculateStatistics(List<HuiPositionDetail> details) {
        if (details.isEmpty()) {
            return null;
        }
        
        List<BigDecimal> deviations = details.stream()
            .map(HuiPositionDetail::getCentDeviation)
            .collect(Collectors.toList());
        
        BigDecimal sum = deviations.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal average = sum.divide(new BigDecimal(deviations.size()), 4, RoundingMode.HALF_UP);
        
        Collections.sort(deviations);
        BigDecimal min = deviations.get(0);
        BigDecimal max = deviations.get(deviations.size() - 1);
        
        // 计算绝对值的平均偏差
        BigDecimal absSum = deviations.stream()
            .map(BigDecimal::abs)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avgAbsDeviation = absSum.divide(new BigDecimal(deviations.size()), 4, RoundingMode.HALF_UP);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("average", average);
        stats.put("min", min);
        stats.put("max", max);
        stats.put("averageAbsDeviation", avgAbsDeviation);
        stats.put("range", max.subtract(min));
        
        return stats;
    }
}
