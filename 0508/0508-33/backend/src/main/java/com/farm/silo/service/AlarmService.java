package com.farm.silo.service;

import com.farm.silo.model.AlarmHistory;
import com.farm.silo.repository.AlarmHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AlarmService {

    private static final Logger logger = LoggerFactory.getLogger(AlarmService.class);
    
    public static final double HIGH_TEMPERATURE_THRESHOLD = 30.0;
    
    private final AlarmHistoryRepository alarmHistoryRepository;
    
    public AlarmService(AlarmHistoryRepository alarmHistoryRepository) {
        this.alarmHistoryRepository = alarmHistoryRepository;
    }
    
    @Transactional
    public AlarmHistory recordAlarm(String siloName, String layerName, 
                                    int siloIndex, int layerIndex, 
                                    double temperature) {
        logger.warn("⚠️ 高温报警: 筒仓{} - {}层, 温度: {}℃ (阈值: {}℃)", 
                   siloName, layerName, temperature, HIGH_TEMPERATURE_THRESHOLD);
        
        AlarmHistory alarm = new AlarmHistory(
            LocalDateTime.now(),
            siloName,
            layerName,
            siloIndex,
            layerIndex,
            temperature,
            HIGH_TEMPERATURE_THRESHOLD
        );
        
        return alarmHistoryRepository.save(alarm);
    }
    
    @Transactional
    public void acknowledgeAlarm(Long alarmId) {
        Optional<AlarmHistory> alarmOpt = alarmHistoryRepository.findById(alarmId);
        alarmOpt.ifPresent(alarm -> {
            alarm.setAcknowledged(true);
            alarmHistoryRepository.save(alarm);
            logger.info("报警已确认: ID={}", alarmId);
        });
    }
    
    public Page<AlarmHistory> getAlarmHistory(String siloName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        if (siloName == null || siloName.isEmpty() || "all".equalsIgnoreCase(siloName)) {
            return alarmHistoryRepository.findAllByOrderByAlarmTimeDesc(pageable);
        }
        
        return alarmHistoryRepository.findBySiloNameOrderByAlarmTimeDesc(siloName, pageable);
    }
    
    public List<AlarmHistory> getUnacknowledgedAlarms() {
        return alarmHistoryRepository.findUnacknowledgedAlarms();
    }
    
    public List<String> getAvailableSiloNames() {
        List<String> names = alarmHistoryRepository.findDistinctSiloNames();
        return names;
    }
    
    public long getTotalAlarmCount() {
        return alarmHistoryRepository.count();
    }
    
    @Transactional
    public void acknowledgeAllAlarms() {
        List<AlarmHistory> unacknowledged = getUnacknowledgedAlarms();
        for (AlarmHistory alarm : unacknowledged) {
            alarm.setAcknowledged(true);
        }
        alarmHistoryRepository.saveAll(unacknowledged);
        logger.info("已确认所有报警: {}条", unacknowledged.size());
    }
}
