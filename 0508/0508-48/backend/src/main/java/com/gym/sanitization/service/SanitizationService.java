package com.gym.sanitization.service;

import com.gym.sanitization.config.TimezoneConfig;
import com.gym.sanitization.dto.ComplianceStatsDTO;
import com.gym.sanitization.dto.DailyStatusDTO;
import com.gym.sanitization.dto.HeatmapDataDTO;
import com.gym.sanitization.dto.SanitizationRequest;
import com.gym.sanitization.entity.Equipment;
import com.gym.sanitization.entity.SanitizationRecord;
import com.gym.sanitization.repository.SanitizationRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class SanitizationService {

    private static final Logger logger = LoggerFactory.getLogger(SanitizationService.class);
    private static final String REDIS_KEY_PREFIX = "sanitization:today:";
    private static final String PHOTO_STORAGE_PATH = "./uploads/sanitization/";

    @Autowired
    private SanitizationRecordRepository recordRepository;

    @Autowired
    private EquipmentService equipmentService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public SanitizationRecord recordSanitization(SanitizationRequest request) {
        logger.info("Recording sanitization for equipment ID: {}", request.getEquipmentId());

        if (!equipmentService.getEquipmentById(request.getEquipmentId()).isPresent()) {
            throw new IllegalArgumentException("Equipment not found with ID: " + request.getEquipmentId());
        }

        SanitizationRecord record = new SanitizationRecord();
        record.setEquipmentId(request.getEquipmentId());
        record.setSanitizationTime(TimezoneConfig.now());
        record.setInspectorName(request.getInspectorName());

        if (StringUtils.hasText(request.getPhotoBase64())) {
            record.setPhotoBase64(request.getPhotoBase64());
            String photoPath = savePhotoLocally(request.getEquipmentId(), request.getPhotoBase64());
            record.setPhotoPath(photoPath);
        }

        SanitizationRecord saved = recordRepository.save(record);
        updateRedisCache(request.getEquipmentId(), saved);

        logger.info("Sanitization recorded successfully, ID: {}, current timezone: Asia/Shanghai (UTC+8)", saved.getId());
        return saved;
    }

    private String savePhotoLocally(Long equipmentId, String base64Data) {
        try {
            File dir = new File(PHOTO_STORAGE_PATH);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String base64Content = base64Data;
            if (base64Data.contains(",")) {
                base64Content = base64Data.split(",")[1];
            }

            String fileName = "equipment_" + equipmentId + "_" + System.currentTimeMillis() + ".jpg";
            String filePath = PHOTO_STORAGE_PATH + fileName;

            byte[] imageBytes = Base64.getDecoder().decode(base64Content);
            try (FileOutputStream fos = new FileOutputStream(filePath)) {
                fos.write(imageBytes);
            }

            logger.info("Photo saved locally: {}", filePath);
            return filePath;
        } catch (IOException e) {
            logger.error("Failed to save photo locally", e);
            return null;
        }
    }

    private void updateRedisCache(Long equipmentId, SanitizationRecord record) {
        String today = TimezoneConfig.formatDate(TimezoneConfig.today());
        String redisKey = REDIS_KEY_PREFIX + today + ":" + equipmentId;

        Map<String, Object> cacheData = new HashMap<>();
        cacheData.put("equipmentId", equipmentId);
        cacheData.put("sanitizationTime", record.getSanitizationTime().toString());
        cacheData.put("photoBase64", record.getPhotoBase64());
        cacheData.put("inspectorName", record.getInspectorName());

        long secondsUntilTomorrow = TimezoneConfig.secondsUntilTomorrow();
        logger.debug("Setting Redis key {} with TTL: {} seconds (until midnight 00:00 UTC+8)", redisKey, secondsUntilTomorrow);

        redisTemplate.opsForValue().set(redisKey, cacheData, secondsUntilTomorrow, TimeUnit.SECONDS);
    }

    public List<DailyStatusDTO> getTodayStatus() {
        logger.info("Getting today's sanitization status for all equipments (UTC+8)");

        List<Equipment> allEquipments = equipmentService.getAllEquipments();
        List<DailyStatusDTO> statusList = new ArrayList<>();
        LocalDate todayDate = TimezoneConfig.today();
        String today = TimezoneConfig.formatDate(todayDate);
        LocalDateTime startOfDay = TimezoneConfig.startOfToday();
        LocalDateTime endOfDay = TimezoneConfig.endOfToday();

        for (Equipment equipment : allEquipments) {
            DailyStatusDTO status = new DailyStatusDTO();
            status.setEquipment(equipment);

            String redisKey = REDIS_KEY_PREFIX + today + ":" + equipment.getId();
            Object cached = redisTemplate.opsForValue().get(redisKey);

            if (cached != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> cacheData = (Map<String, Object>) cached;
                status.setSanitized(true);
                status.setLastSanitizationTime(LocalDateTime.parse((String) cacheData.get("sanitizationTime")));
                status.setLastPhotoBase64((String) cacheData.get("photoBase64"));
                status.setLastInspectorName((String) cacheData.get("inspectorName"));
            } else {
                List<SanitizationRecord> todayRecords = recordRepository.findByEquipmentIdAndSanitizationTimeBetween(
                    equipment.getId(), startOfDay, endOfDay
                );

                if (!todayRecords.isEmpty()) {
                    SanitizationRecord latest = todayRecords.get(0);
                    status.setSanitized(true);
                    status.setLastSanitizationTime(latest.getSanitizationTime());
                    status.setLastPhotoBase64(latest.getPhotoBase64());
                    status.setLastInspectorName(latest.getInspectorName());
                    updateRedisCache(equipment.getId(), latest);
                } else {
                    status.setSanitized(false);
                }
            }

            statusList.add(status);
        }

        return statusList;
    }

    public List<HeatmapDataDTO> getLast7DaysHeatmap() {
        logger.info("Generating heatmap data for last 7 days (UTC+8)");

        List<Equipment> equipments = equipmentService.getAllEquipments();
        Map<String, HeatmapDataDTO> heatmapMap = new LinkedHashMap<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = TimezoneConfig.today().minusDays(i);
            String dateStr = TimezoneConfig.formatDate(date);
            LocalDateTime startOfDay = TimezoneConfig.startOfDay(date);
            LocalDateTime endOfDay = TimezoneConfig.endOfDay(date);

            for (Equipment equipment : equipments) {
                String key = dateStr + "_" + equipment.getId();
                int count = recordRepository.countByEquipmentIdAndTimeBetween(
                    equipment.getId(), startOfDay, endOfDay
                );

                HeatmapDataDTO data = new HeatmapDataDTO();
                data.setDate(dateStr);
                data.setEquipmentId(equipment.getId());
                data.setEquipmentName(equipment.getName());
                data.setCount(count);

                heatmapMap.put(key, data);
            }
        }

        return new ArrayList<>(heatmapMap.values());
    }

    public List<SanitizationRecord> getRecordsByEquipmentId(Long equipmentId) {
        LocalDateTime now = TimezoneConfig.now();
        return recordRepository.findByEquipmentIdAndSanitizationTimeBetween(
            equipmentId,
            now.minusDays(7),
            now
        );
    }

    public List<SanitizationRecord> batchRecordSanitization(List<Long> equipmentIds, String inspectorName, String photoBase64) {
        logger.info("Batch recording sanitization for {} equipments", equipmentIds.size());

        List<SanitizationRecord> savedRecords = new ArrayList<>();

        for (Long equipmentId : equipmentIds) {
            if (!equipmentService.getEquipmentById(equipmentId).isPresent()) {
                logger.warn("Equipment not found, skipping ID: {}", equipmentId);
                continue;
            }

            SanitizationRecord record = new SanitizationRecord();
            record.setEquipmentId(equipmentId);
            record.setSanitizationTime(TimezoneConfig.now());
            record.setInspectorName(inspectorName);

            if (StringUtils.hasText(photoBase64)) {
                record.setPhotoBase64(photoBase64);
                String photoPath = savePhotoLocally(equipmentId, photoBase64);
                record.setPhotoPath(photoPath);
            }

            SanitizationRecord saved = recordRepository.save(record);
            updateRedisCache(equipmentId, saved);
            savedRecords.add(saved);

            logger.debug("Batch sanitization recorded for equipment ID: {}", equipmentId);
        }

        logger.info("Batch sanitization completed. {} records saved", savedRecords.size());
        return savedRecords;
    }

    public ComplianceStatsDTO getComplianceStats(String timePeriod) {
        logger.info("Getting compliance stats for period: {}", timePeriod);

        LocalDateTime now = TimezoneConfig.now();
        LocalDateTime startTime;

        switch (timePeriod.toUpperCase()) {
            case "TODAY":
                startTime = TimezoneConfig.startOfToday();
                break;
            case "LAST_7_DAYS":
                startTime = now.minusDays(7);
                break;
            case "LAST_30_DAYS":
                startTime = now.minusDays(30);
                break;
            default:
                startTime = now.minusDays(7);
        }

        List<Equipment> allEquipments = equipmentService.getAllEquipments();
        int totalEquipmentCount = allEquipments.size();
        int onTimeCount = 0;
        int overdueCount = 0;

        for (Equipment equipment : allEquipments) {
            Optional<SanitizationRecord> lastRecord = 
                recordRepository.findFirstByEquipmentIdOrderBySanitizationTimeDesc(equipment.getId());

            if (lastRecord.isPresent()) {
                SanitizationRecord record = lastRecord.get();
                LocalDateTime lastTime = record.getSanitizationTime();
                
                if (lastTime.isBefore(startTime)) {
                    overdueCount++;
                } else {
                    long hoursSinceLast = Duration.between(lastTime, now).toHours();
                    int intervalHours = equipment.getSanitizationIntervalHours();
                    
                    if (hoursSinceLast <= intervalHours) {
                        onTimeCount++;
                    } else {
                        overdueCount++;
                    }
                }
            } else {
                overdueCount++;
            }
        }

        int total = onTimeCount + overdueCount;
        double complianceRate = total > 0 ? (double) onTimeCount / total * 100 : 0.0;

        ComplianceStatsDTO stats = ComplianceStatsDTO.builder()
            .onTimeCount(onTimeCount)
            .overdueCount(overdueCount)
            .totalCount(totalEquipmentCount)
            .complianceRate(Math.round(complianceRate * 100.0) / 100.0)
            .timePeriod(timePeriod)
            .build();

        logger.info("Compliance Stats - OnTime: {}, Overdue: {}, Total: {}, Rate: {}%", 
            onTimeCount, overdueCount, totalEquipmentCount, stats.getComplianceRate());

        return stats;
    }
}
