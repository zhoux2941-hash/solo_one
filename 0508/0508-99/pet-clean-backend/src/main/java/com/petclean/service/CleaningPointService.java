package com.petclean.service;

import com.petclean.dto.CleaningResult;
import com.petclean.entity.CleaningPoint;
import com.petclean.repository.CleaningPointRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CleaningPointService {

    private final CleaningPointRepository cleaningPointRepository;

    @Value("${app.cleaning.remind-hours:48}")
    private int remindHours;

    @Value("${app.cleaning.cooldown-hours:48}")
    private int cooldownHours;

    public List<CleaningPoint> getAllCleaningPoints() {
        return cleaningPointRepository.findAll();
    }

    public Optional<CleaningPoint> getCleaningPointById(Long id) {
        return cleaningPointRepository.findById(id);
    }

    public List<CleaningPoint> getCleaningPointsByStatus(String status) {
        return cleaningPointRepository.findByStatus(status);
    }

    public List<CleaningPoint> getExpiredCleaningPoints() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(remindHours);
        return cleaningPointRepository.findExpiredCleaningPoints("clean", cutoffTime);
    }

    @Transactional
    public CleaningResult checkInCleaningPoint(BigDecimal latitude, BigDecimal longitude,
                                                String description, Long userId) {
        Optional<CleaningPoint> existing = cleaningPointRepository.findAll().stream()
                .filter(p -> isNearby(p.getLatitude(), p.getLongitude(), latitude, longitude))
                .findFirst();

        if (existing.isPresent()) {
            CleaningPoint point = existing.get();
            return handleExistingPoint(point, description, userId);
        } else {
            return createNewPoint(latitude, longitude, description, userId);
        }
    }

    private CleaningResult handleExistingPoint(CleaningPoint point, String description, Long userId) {
        if ("pending".equals(point.getStatus())) {
            point.setStatus("clean");
            point.setLastCleanTime(LocalDateTime.now());
            point.setLastCleanUserId(userId);
            if (description != null && !description.isEmpty()) {
                point.setDescription(description);
            }
            cleaningPointRepository.save(point);
            log.info("清理点 {} 从待清理标记为已清理，用户 {} 获得积分", point.getId(), userId);
            return new CleaningResult(point.getId(), true, "重新清理成功，获得积分！");
        }

        long hoursSinceLastClean = Duration.between(
                point.getLastCleanTime() != null ? point.getLastCleanTime() : point.getCreatedAt(),
                LocalDateTime.now()
        ).toHours();

        if (hoursSinceLastClean < cooldownHours) {
            long remainingHours = cooldownHours - hoursSinceLastClean;
            log.info("清理点 {} 仍在冷却期，剩余 {} 小时，不发放积分", point.getId(), remainingHours);
            return new CleaningResult(point.getId(), false,
                    String.format("该位置已清理过，冷却期内无法获得积分（剩余 %d 小时）", remainingHours));
        }

        point.setLastCleanTime(LocalDateTime.now());
        point.setLastCleanUserId(userId);
        if (description != null && !description.isEmpty()) {
            point.setDescription(description);
        }
        cleaningPointRepository.save(point);
        log.info("清理点 {} 超过冷却期，用户 {} 重新清理获得积分", point.getId(), userId);
        return new CleaningResult(point.getId(), true, "超过冷却期，重新清理成功！");
    }

    private CleaningResult createNewPoint(BigDecimal latitude, BigDecimal longitude,
                                           String description, Long userId) {
        CleaningPoint newPoint = new CleaningPoint();
        newPoint.setLatitude(latitude);
        newPoint.setLongitude(longitude);
        newPoint.setDescription(description);
        newPoint.setLastCleanTime(LocalDateTime.now());
        newPoint.setLastCleanUserId(userId);
        newPoint.setStatus("clean");
        CleaningPoint saved = cleaningPointRepository.save(newPoint);
        log.info("创建新清理点 {}，用户 {} 获得积分", saved.getId(), userId);
        return new CleaningResult(saved.getId(), true, "首次清理成功，获得积分！");
    }

    @Transactional
    public CleaningPoint markAsPending(Long id) {
        CleaningPoint point = cleaningPointRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("清理点不存在"));
        point.setStatus("pending");
        return cleaningPointRepository.save(point);
    }

    @Transactional
    public CleaningPoint updateCleaned(Long id, Long userId) {
        CleaningPoint point = cleaningPointRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("清理点不存在"));
        point.setStatus("clean");
        point.setLastCleanTime(LocalDateTime.now());
        point.setLastCleanUserId(userId);
        return cleaningPointRepository.save(point);
    }

    private boolean isNearby(BigDecimal lat1, BigDecimal lon1, BigDecimal lat2, BigDecimal lon2) {
        double distance = calculateDistance(
                lat1.doubleValue(), lon1.doubleValue(),
                lat2.doubleValue(), lon2.doubleValue()
        );
        return distance < 0.01;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
