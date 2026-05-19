package com.industrial.workorder.service;

import com.industrial.workorder.entity.AlertMessage;
import com.industrial.workorder.repository.AlertMessageRepository;
import com.industrial.workorder.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class AlertMessageService {

    @Autowired
    private AlertMessageRepository alertMessageRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public List<AlertMessage> findAll() {
        List<AlertMessage> alerts = alertMessageRepository.findAll();
        alerts.forEach(this::populateTransientFields);
        return alerts;
    }

    public Optional<AlertMessage> findById(Long id) {
        Optional<AlertMessage> alertOpt = alertMessageRepository.findById(id);
        alertOpt.ifPresent(this::populateTransientFields);
        return alertOpt;
    }

    public List<AlertMessage> findUnread() {
        List<AlertMessage> alerts = alertMessageRepository.findByReadFlagFalse();
        alerts.forEach(this::populateTransientFields);
        return alerts;
    }

    public List<AlertMessage> findLatest() {
        List<AlertMessage> alerts = alertMessageRepository.findTop10ByOrderByAlertTimeDesc();
        alerts.forEach(this::populateTransientFields);
        return alerts;
    }

    public AlertMessage save(AlertMessage alert) {
        AlertMessage saved = alertMessageRepository.save(alert);
        populateTransientFields(saved);
        sendAlertNotification(saved);
        return saved;
    }

    public AlertMessage markAsRead(Long id) {
        Optional<AlertMessage> alertOpt = alertMessageRepository.findById(id);
        if (alertOpt.isPresent()) {
            AlertMessage alert = alertOpt.get();
            alert.setReadFlag(true);
            AlertMessage saved = alertMessageRepository.save(alert);
            populateTransientFields(saved);
            return saved;
        }
        return null;
    }

    public void deleteById(Long id) {
        alertMessageRepository.deleteById(id);
    }

    private void populateTransientFields(AlertMessage alert) {
        deviceRepository.findById(alert.getDeviceId()).ifPresent(d -> {
            alert.setDeviceName(d.getDeviceName());
            alert.setDeviceCode(d.getDeviceCode());
        });
    }

    private void sendAlertNotification(AlertMessage alert) {
        try {
            messagingTemplate.convertAndSend("/topic/alerts", alert);
        } catch (Exception e) {
        }
    }

    @Scheduled(fixedRate = 30000)
    public void simulateDeviceAlerts() {
        Random random = new Random();
        if (random.nextInt(10) < 3) {
            deviceRepository.findAll().forEach(device -> {
                if (random.nextInt(10) < 2) {
                    String[] alertTypes = {"温度过高", "压力异常", "振动超限", "电流异常", "通讯中断"};
                    String[] levels = {"INFO", "WARNING", "ERROR"};
                    
                    AlertMessage alert = new AlertMessage();
                    alert.setDeviceId(device.getId());
                    alert.setTitle(alertTypes[random.nextInt(alertTypes.length)]);
                    alert.setContent("设备 " + device.getDeviceName() + " 检测到异常，请及时处理");
                    alert.setLevel(levels[random.nextInt(levels.length)]);
                    alert.setReadFlag(false);
                    alert.setAlertTime(LocalDateTime.now());
                    
                    alertMessageRepository.save(alert);
                    populateTransientFields(alert);
                    sendAlertNotification(alert);
                    
                    device.setStatus("FAULT");
                    deviceRepository.save(device);
                }
            });
        }
    }
}
