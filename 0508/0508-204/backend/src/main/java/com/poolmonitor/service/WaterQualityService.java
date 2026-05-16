package com.poolmonitor.service;

import com.poolmonitor.entity.AlertRecord;
import com.poolmonitor.entity.WaterQualityData;
import com.poolmonitor.repository.AlertRecordRepository;
import com.poolmonitor.repository.WaterQualityDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class WaterQualityService {

    @Autowired
    private WaterQualityDataRepository waterQualityDataRepository;

    @Autowired
    private AlertRecordRepository alertRecordRepository;

    private static final double MIN_RESIDUAL_CHLORINE = 0.3;
    private static final double MAX_RESIDUAL_CHLORINE = 1.0;
    private static final double MIN_PH = 6.5;
    private static final double MAX_PH = 8.5;
    private static final double MAX_TURBIDITY = 1.0;

    public static final String ALERT_TYPE_CHLORINE_LOW = "余氯过低";
    public static final String ALERT_TYPE_CHLORINE_HIGH = "余氯过高";
    public static final String ALERT_TYPE_PH_LOW = "PH值过低";
    public static final String ALERT_TYPE_PH_HIGH = "PH值过高";
    public static final String ALERT_TYPE_TURBIDITY_HIGH = "浊度过高";

    @Transactional
    public WaterQualityData addWaterQualityData(WaterQualityData data) {
        data.setStandard(checkStandard(data));
        WaterQualityData savedData = waterQualityDataRepository.save(data);
        
        processAlerts(savedData);
        
        return savedData;
    }

    private void processAlerts(WaterQualityData data) {
        boolean chlorineOk = data.getResidualChlorine() >= MIN_RESIDUAL_CHLORINE && 
                            data.getResidualChlorine() <= MAX_RESIDUAL_CHLORINE;
        boolean phOk = data.getPhValue() >= MIN_PH && data.getPhValue() <= MAX_PH;
        boolean turbidityOk = data.getTurbidity() <= MAX_TURBIDITY;

        if (chlorineOk) {
            autoHandleAlert(ALERT_TYPE_CHLORINE_LOW, data);
            autoHandleAlert(ALERT_TYPE_CHLORINE_HIGH, data);
        }
        if (phOk) {
            autoHandleAlert(ALERT_TYPE_PH_LOW, data);
            autoHandleAlert(ALERT_TYPE_PH_HIGH, data);
        }
        if (turbidityOk) {
            autoHandleAlert(ALERT_TYPE_TURBIDITY_HIGH, data);
        }

        if (!chlorineOk || !phOk || !turbidityOk) {
            createAlerts(data, chlorineOk, phOk, turbidityOk);
        }
    }

    private void autoHandleAlert(String alertType, WaterQualityData data) {
        alertRecordRepository.findByAlertTypeAndIsHandled(alertType, false)
                .ifPresent(alert -> {
                    alert.setIsHandled(true);
                    alert.setHandler("系统");
                    alert.setHandleMeasure("水质恢复正常，自动解除告警");
                    alert.setHandleTime(data.getRecordTime());
                    alert.setUpdateTime(LocalDateTime.now());
                    alertRecordRepository.save(alert);
                });
    }

    private void createAlerts(WaterQualityData data, boolean chlorineOk, boolean phOk, boolean turbidityOk) {
        if (!chlorineOk) {
            if (data.getResidualChlorine() < MIN_RESIDUAL_CHLORINE) {
                createAlertIfNotExists(data, ALERT_TYPE_CHLORINE_LOW,
                        "余氯过低: " + data.getResidualChlorine() + "mg/L，标准范围: 0.3-1.0mg/L");
            } else {
                createAlertIfNotExists(data, ALERT_TYPE_CHLORINE_HIGH,
                        "余氯过高: " + data.getResidualChlorine() + "mg/L，标准范围: 0.3-1.0mg/L");
            }
        }

        if (!phOk) {
            if (data.getPhValue() < MIN_PH) {
                createAlertIfNotExists(data, ALERT_TYPE_PH_LOW,
                        "PH值过低: " + data.getPhValue() + "，标准范围: 6.5-8.5");
            } else {
                createAlertIfNotExists(data, ALERT_TYPE_PH_HIGH,
                        "PH值过高: " + data.getPhValue() + "，标准范围: 6.5-8.5");
            }
        }

        if (!turbidityOk) {
            createAlertIfNotExists(data, ALERT_TYPE_TURBIDITY_HIGH,
                    "浊度过高: " + data.getTurbidity() + "，标准: ≤1");
        }
    }

    private void createAlertIfNotExists(WaterQualityData data, String alertType, String alertContent) {
        Optional<AlertRecord> existingAlert = alertRecordRepository.findByAlertTypeAndIsHandled(alertType, false);
        if (existingAlert.isEmpty()) {
            AlertRecord alert = new AlertRecord();
            alert.setWaterDataId(data.getId());
            alert.setAlertType(alertType);
            alert.setAlertContent(alertContent);
            alert.setAlertLevel("高");
            alert.setAlertTime(data.getRecordTime());
            alertRecordRepository.save(alert);
        }
    }

    public boolean checkStandard(WaterQualityData data) {
        boolean chlorineOk = data.getResidualChlorine() >= MIN_RESIDUAL_CHLORINE && 
                            data.getResidualChlorine() <= MAX_RESIDUAL_CHLORINE;
        boolean phOk = data.getPhValue() >= MIN_PH && data.getPhValue() <= MAX_PH;
        boolean turbidityOk = data.getTurbidity() <= MAX_TURBIDITY;
        return chlorineOk && phOk && turbidityOk;
    }

    public List<WaterQualityData> getAllData() {
        return waterQualityDataRepository.findTop24ByOrderByRecordTimeDesc();
    }

    public List<WaterQualityData> getDataByDateRange(LocalDateTime startTime, LocalDateTime endTime) {
        return waterQualityDataRepository.findByRecordTimeBetweenOrderByRecordTimeDesc(startTime, endTime);
    }

    public Map<String, Object> getDailyReport(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        
        Long total = waterQualityDataRepository.countTotalData(start, end);
        Long standard = waterQualityDataRepository.countStandardData(start, end);
        
        Map<String, Object> report = new HashMap<>();
        report.put("date", date.toString());
        report.put("totalRecords", total);
        report.put("standardRecords", standard);
        report.put("passRate", total > 0 ? (standard * 100.0 / total) : 0);
        report.put("dataList", getDataByDateRange(start, end));
        
        return report;
    }

    public Map<String, Object> getMonthlyReport(int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        
        Long total = waterQualityDataRepository.countTotalData(start, end);
        Long standard = waterQualityDataRepository.countStandardData(start, end);
        
        Map<String, Object> report = new HashMap<>();
        report.put("year", year);
        report.put("month", month);
        report.put("totalRecords", total);
        report.put("standardRecords", standard);
        report.put("passRate", total > 0 ? (standard * 100.0 / total) : 0);
        
        List<Map<String, Object>> dailyStats = new ArrayList<>();
        for (int i = 1; i <= endDate.getDayOfMonth(); i++) {
            LocalDate day = LocalDate.of(year, month, i);
            LocalDateTime dayStart = day.atStartOfDay();
            LocalDateTime dayEnd = day.atTime(LocalTime.MAX);
            Long dayTotal = waterQualityDataRepository.countTotalData(dayStart, dayEnd);
            Long dayStandard = waterQualityDataRepository.countStandardData(dayStart, dayEnd);
            Map<String, Object> dayStat = new HashMap<>();
            dayStat.put("date", day.toString());
            dayStat.put("passRate", dayTotal > 0 ? (dayStandard * 100.0 / dayTotal) : 0);
            dailyStats.add(dayStat);
        }
        report.put("dailyStats", dailyStats);
        
        return report;
    }

    public Map<String, Object> getTrendData(int hours) {
        LocalDateTime startTime = LocalDateTime.now().minusHours(hours);
        List<WaterQualityData> dataList = waterQualityDataRepository.findRecentData(startTime);
        Collections.reverse(dataList);
        
        Map<String, Object> trend = new HashMap<>();
        List<String> timeLabels = new ArrayList<>();
        List<Double> chlorineData = new ArrayList<>();
        List<Double> phData = new ArrayList<>();
        List<Double> turbidityData = new ArrayList<>();
        List<Double> tempData = new ArrayList<>();
        
        for (WaterQualityData data : dataList) {
            timeLabels.add(data.getRecordTime().toString());
            chlorineData.add(data.getResidualChlorine());
            phData.add(data.getPhValue());
            turbidityData.add(data.getTurbidity());
            tempData.add(data.getWaterTemperature());
        }
        
        trend.put("timeLabels", timeLabels);
        trend.put("residualChlorine", chlorineData);
        trend.put("phValue", phData);
        trend.put("turbidity", turbidityData);
        trend.put("waterTemperature", tempData);
        
        return trend;
    }
}