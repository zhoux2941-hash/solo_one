package com.psychiatric.service;

import com.psychiatric.entity.Alert;
import com.psychiatric.entity.Patient;
import com.psychiatric.repository.AlertRepository;
import com.psychiatric.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class AlertService {
    
    @Autowired
    private AlertRepository alertRepository;
    
    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private LocationRecordService locationRecordService;
    
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }
    
    public List<Alert> getUnreadAlerts() {
        return alertRepository.findByIsReadOrderByAlertTimeDesc(false);
    }
    
    public Alert markAsRead(Long alertId) {
        return alertRepository.findById(alertId).map(alert -> {
            alert.setIsRead(true);
            return alertRepository.save(alert);
        }).orElse(null);
    }
    
    @Scheduled(cron = "0 10 6 * * ?")
    public void analyzeNightActivity() {
        List<String> braceletIds = locationRecordService.getAllBraceletIdsWithNightActivity();
        
        for (String braceletId : braceletIds) {
            int consecutiveNights = 0;
            LocalDate today = LocalDate.now();
            
            for (int i = 1; i <= 3; i++) {
                LocalDate checkDate = today.minusDays(i);
                LocalDateTime startTime = LocalDateTime.of(checkDate, LocalTime.of(23, 0));
                LocalDateTime endTime = LocalDateTime.of(checkDate.plusDays(1), LocalTime.of(6, 0));
                
                long count = locationRecordService.countNightCorridorActivity(braceletId, startTime, endTime);
                
                if (count > 5) {
                    consecutiveNights++;
                } else {
                    break;
                }
            }
            
            if (consecutiveNights >= 3) {
                Patient patient = patientRepository.findByBraceletId(braceletId).orElse(null);
                if (patient != null) {
                    Alert alert = new Alert();
                    alert.setBraceletId(braceletId);
                    alert.setPatientName(patient.getName());
                    alert.setAlertType("夜间活动异常");
                    alert.setMessage("患者连续" + consecutiveNights + "晚夜间在走廊活动超过5次，可能失眠或病情变化");
                    alert.setAlertTime(LocalDateTime.now());
                    alert.setIsRead(false);
                    alertRepository.save(alert);
                }
            }
        }
    }
    
    public void triggerAnalysis() {
        analyzeNightActivity();
    }
}
