package com.buscompany.fatigue.service;

import com.buscompany.fatigue.dto.DeviceDataRequest;
import com.buscompany.fatigue.entity.Alert;
import com.buscompany.fatigue.entity.DeviceData;
import com.buscompany.fatigue.entity.Driver;
import com.buscompany.fatigue.repository.AlertRepository;
import com.buscompany.fatigue.repository.DeviceDataRepository;
import com.buscompany.fatigue.repository.DriverRepository;
import com.buscompany.fatigue.websocket.AlertWebSocket;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FatigueMonitorService {
    @Autowired
    private DeviceDataRepository deviceDataRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Value("${fatigue.alert.yawn-threshold:2}")
    private int yawnThreshold;

    @Value("${fatigue.alert.eye-close-threshold:3}")
    private int eyeCloseThreshold;

    @Value("${fatigue.alert.distraction-threshold:3}")
    private int distractionThreshold;

    @Value("${fatigue.alert.time-window-seconds:30}")
    private int timeWindowSeconds;

    private Map<String, LocalDateTime> lastAlertTime = new HashMap<>();

    public DeviceData processDeviceData(DeviceDataRequest request) {
        DeviceData data = new DeviceData();
        data.setDriverNo(request.getDriverNo());
        data.setBusNo(request.getBusNo());
        data.setYawning(request.getYawning() != null ? request.getYawning() : false);
        data.setEyeClosed(request.getEyeClosed() != null ? request.getEyeClosed() : false);
        data.setDistracted(request.getDistracted() != null ? request.getDistracted() : false);
        data.setEyeAspectRatio(request.getEyeAspectRatio());
        data.setMouthOpenness(request.getMouthOpenness());
        data.setTimestamp(LocalDateTime.now());

        deviceDataRepository.save(data);

        Driver driver = updateDriverOnlineStatus(request.getDriverNo());

        AlertWebSocket.broadcastDeviceData(data);
        if (driver != null) {
            AlertWebSocket.broadcastDriverStatusUpdate(driver);
        }

        checkFatigueAndAlert(request.getDriverNo(), request.getBusNo());

        return data;
    }

    private Driver updateDriverOnlineStatus(String driverNo) {
        return driverRepository.findByDriverNo(driverNo).map(driver -> {
            driver.setOnline(true);
            driver.setLastOnlineTime(LocalDateTime.now());
            Driver savedDriver = driverRepository.save(driver);
            return savedDriver;
        }).orElse(null);
    }

    private void checkFatigueAndAlert(String driverNo, String busNo) {
        LocalDateTime startTime = LocalDateTime.now().minusSeconds(timeWindowSeconds);
        List<DeviceData> recentData = deviceDataRepository.findRecentData(driverNo, startTime);

        int yawnCount = 0;
        int eyeCloseCount = 0;
        int distractionCount = 0;

        for (DeviceData data : recentData) {
            if (data.getYawning()) yawnCount++;
            if (data.getEyeClosed()) eyeCloseCount++;
            if (data.getDistracted()) distractionCount++;
        }

        String alertType = null;
        int count = 0;
        String message = null;

        if (yawnCount >= yawnThreshold) {
            alertType = "频繁打哈欠";
            count = yawnCount;
            message = String.format("司机%d分钟内打哈欠%d次，疑似疲劳驾驶", timeWindowSeconds / 60, yawnCount);
        } else if (eyeCloseCount >= eyeCloseThreshold) {
            alertType = "频繁闭眼";
            count = eyeCloseCount;
            message = String.format("司机%d分钟内闭眼%d次，疑似疲劳驾驶", timeWindowSeconds / 60, eyeCloseCount);
        } else if (distractionCount >= distractionThreshold) {
            alertType = "分心驾驶";
            count = distractionCount;
            message = String.format("司机%d分钟内分心%d次，请提醒注意", timeWindowSeconds / 60, distractionCount);
        }

        if (alertType != null) {
            LocalDateTime lastAlert = lastAlertTime.get(driverNo);
            if (lastAlert == null || lastAlert.plusSeconds(5).isBefore(LocalDateTime.now())) {
                createAlert(driverNo, busNo, alertType, count, message);
                lastAlertTime.put(driverNo, LocalDateTime.now());
            }
        }
    }

    private void createAlert(String driverNo, String busNo, String alertType, int count, String message) {
        Driver driver = driverRepository.findByDriverNo(driverNo).orElse(null);
        String driverName = driver != null ? driver.getName() : "未知";

        Alert alert = new Alert();
        alert.setDriverNo(driverNo);
        alert.setDriverName(driverName);
        alert.setBusNo(busNo);
        alert.setAlertType(alertType);
        alert.setAlertLevel("WARNING");
        alert.setMessage(message);
        alert.setCount(count);
        alert.setHandled(false);

        alertRepository.save(alert);
        AlertWebSocket.broadcastAlert(alert);
    }

    public Alert handleAlert(Long alertId, String handledBy) {
        return alertRepository.findById(alertId).map(alert -> {
            alert.setHandled(true);
            alert.setHandledBy(handledBy);
            alert.setHandleTime(LocalDateTime.now());
            return alertRepository.save(alert);
        }).orElse(null);
    }
}
