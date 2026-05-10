package com.petclean.service;

import com.petclean.entity.RescuePoint;
import com.petclean.entity.RescueRecord;
import com.petclean.repository.RescuePointRepository;
import com.petclean.repository.RescueRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RescueService {

    private final RescuePointRepository rescuePointRepository;
    private final RescueRecordRepository rescueRecordRepository;

    public List<RescuePoint> getAllRescuePoints() {
        return rescuePointRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<RescuePoint> getRescuePointsByStatus(String status) {
        return rescuePointRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    public Optional<RescuePoint> getRescuePointById(Long id) {
        return rescuePointRepository.findById(id);
    }

    public List<RescueRecord> getRecordsByPoint(Long pointId) {
        return rescueRecordRepository.findByRescuePointIdOrderByCreatedAtDesc(pointId);
    }

    public List<RescueRecord> getRecordsByUser(Long userId) {
        return rescueRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public RescuePoint reportStrayAnimal(Long userId, BigDecimal latitude, BigDecimal longitude,
                                          String animalType, String description, String photoUrl) {
        RescuePoint point = new RescuePoint();
        point.setLatitude(latitude);
        point.setLongitude(longitude);
        point.setAnimalType(animalType);
        point.setDescription(description);
        point.setPhotoUrl(photoUrl);
        point.setStatus("need_rescue");
        point.setReportedBy(userId);

        RescuePoint saved = rescuePointRepository.save(point);
        log.info("用户 {} 报告发现流浪动物: 位置({}, {}), 类型: {}", userId, latitude, longitude, animalType);

        RescueRecord record = new RescueRecord();
        record.setRescuePointId(saved.getId());
        record.setUserId(userId);
        record.setActionType("report");
        record.setNote("发现流浪动物");
        rescueRecordRepository.save(record);

        return saved;
    }

    @Transactional
    public RescuePoint provideSupplies(Long pointId, Long userId, String note, String photoUrl) {
        RescuePoint point = rescuePointRepository.findById(pointId)
                .orElseThrow(() -> new RuntimeException("救助点不存在"));

        if ("rescued".equals(point.getStatus())) {
            throw new RuntimeException("该救助点已标记为已救助");
        }

        RescueRecord record = new RescueRecord();
        record.setRescuePointId(pointId);
        record.setUserId(userId);
        record.setActionType("supply");
        record.setNote(note != null ? note : "提供了食物/水");
        record.setPhotoUrl(photoUrl);
        rescueRecordRepository.save(record);

        log.info("用户 {} 为救助点 {} 提供物资", userId, pointId);
        return point;
    }

    @Transactional
    public RescuePoint markAsRescued(Long pointId, Long userId, String rescueNote, String photoUrl) {
        RescuePoint point = rescuePointRepository.findById(pointId)
                .orElseThrow(() -> new RuntimeException("救助点不存在"));

        point.setStatus("rescued");
        point.setRescuedBy(userId);
        point.setRescuedTime(LocalDateTime.now());
        point.setRescueNote(rescueNote);

        RescuePoint saved = rescuePointRepository.save(point);
        log.info("用户 {} 标记救助点 {} 为已救助", userId, pointId);

        RescueRecord record = new RescueRecord();
        record.setRescuePointId(pointId);
        record.setUserId(userId);
        record.setActionType("rescue");
        record.setNote(rescueNote != null ? rescueNote : "已救助");
        record.setPhotoUrl(photoUrl);
        rescueRecordRepository.save(record);

        return saved;
    }

    public long countTotalReported() {
        return rescuePointRepository.count();
    }

    public long countTotalRescued() {
        return rescuePointRepository.findByStatusOrderByCreatedAtDesc("rescued").size();
    }

    public long countNeedRescue() {
        return rescuePointRepository.findByStatusOrderByCreatedAtDesc("need_rescue").size();
    }
}
