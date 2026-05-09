package com.gym.sanitization.service;

import com.gym.sanitization.config.TimezoneConfig;
import com.gym.sanitization.dto.SanitizationAlertDTO;
import com.gym.sanitization.entity.Equipment;
import com.gym.sanitization.entity.SanitizationRecord;
import com.gym.sanitization.repository.SanitizationRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SanitizationScheduledTask {

    private static final Logger logger = LoggerFactory.getLogger(SanitizationScheduledTask.class);

    @Autowired
    private EquipmentService equipmentService;

    @Autowired
    private SanitizationRecordRepository recordRepository;

    @Autowired
    private WebSocketService webSocketService;

    @Scheduled(fixedRate = 30 * 60 * 1000, initialDelay = 10 * 1000)
    public void checkSanitizationStatus() {
        logger.info("===== Starting scheduled sanitization check (UTC+8) =====");

        LocalDateTime now = TimezoneConfig.now();
        List<Equipment> allEquipments = equipmentService.getAllEquipments();
        List<SanitizationAlertDTO> overdueAlerts = new ArrayList<>();

        for (Equipment equipment : allEquipments) {
            Optional<SanitizationRecord> lastRecord = 
                recordRepository.findFirstByEquipmentIdOrderBySanitizationTimeDesc(equipment.getId());

            if (lastRecord.isPresent()) {
                SanitizationRecord record = lastRecord.get();
                LocalDateTime lastTime = record.getSanitizationTime();
                long hoursSinceLast = Duration.between(lastTime, now).toHours();
                int intervalHours = equipment.getSanitizationIntervalHours();

                if (hoursSinceLast > intervalHours) {
                    SanitizationAlertDTO alert = SanitizationAlertDTO.builder()
                        .equipmentId(equipment.getId())
                        .equipmentName(equipment.getName())
                        .equipmentCategory(equipment.getCategory())
                        .sanitizationIntervalHours(intervalHours)
                        .lastSanitizationTime(lastTime)
                        .overdueHours(hoursSinceLast - intervalHours)
                        .status("OVERDUE")
                        .alertTime(now)
                        .build();
                    overdueAlerts.add(alert);
                    logger.warn("OVERDUE: {} - Last: {}, Interval: {}h, Overdue: {}h", 
                        equipment.getName(), lastTime, intervalHours, hoursSinceLast - intervalHours);
                } else {
                    logger.debug("ON TIME: {} - Last: {}, Interval: {}h, Elapsed: {}h",
                        equipment.getName(), lastTime, intervalHours, hoursSinceLast);
                }
            } else {
                SanitizationAlertDTO alert = SanitizationAlertDTO.builder()
                    .equipmentId(equipment.getId())
                    .equipmentName(equipment.getName())
                    .equipmentCategory(equipment.getCategory())
                    .sanitizationIntervalHours(equipment.getSanitizationIntervalHours())
                    .lastSanitizationTime(null)
                    .overdueHours(-1L)
                    .status("NEVER_SANITIZED")
                    .alertTime(now)
                    .build();
                overdueAlerts.add(alert);
                logger.warn("NEVER SANITIZED: {}", equipment.getName());
            }
        }

        if (!overdueAlerts.isEmpty()) {
            webSocketService.sendAlerts(overdueAlerts);
            logger.info("Sent {} overdue alerts via WebSocket", overdueAlerts.size());
        } else {
            logger.info("All equipments are sanitized on time");
        }

        logger.info("===== Scheduled check completed =====");
    }
}
