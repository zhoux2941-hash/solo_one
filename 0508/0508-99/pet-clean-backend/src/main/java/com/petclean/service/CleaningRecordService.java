package com.petclean.service;

import com.petclean.dto.CleaningResponse;
import com.petclean.dto.CleaningResult;
import com.petclean.entity.CleaningRecord;
import com.petclean.entity.Community;
import com.petclean.entity.User;
import com.petclean.repository.CleaningRecordRepository;
import com.petclean.repository.CommunityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CleaningRecordService {

    private final CleaningRecordRepository cleaningRecordRepository;
    private final CleaningPointService cleaningPointService;
    private final UserService userService;
    private final BuildingService buildingService;
    private final CommunityRepository communityRepository;
    private final NotificationService notificationService;

    @Value("${app.cleaning.points-per-clean:10}")
    private int pointsPerClean;

    public List<CleaningRecord> getUserRecords(Long userId) {
        return cleaningRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<CleaningRecord> getPointRecords(Long cleaningPointId) {
        return cleaningRecordRepository.findByCleaningPointIdOrderByCreatedAtDesc(cleaningPointId);
    }

    @Transactional
    public CleaningResponse createCleaningRecord(Long userId, BigDecimal latitude,
                                                  BigDecimal longitude, String description, String photoUrl) {
        User user = userService.getUserById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        CleaningResult result = cleaningPointService.checkInCleaningPoint(
                latitude, longitude, description, userId
        );

        int earnedPoints = result.isShouldAwardPoints() ? pointsPerClean : 0;

        CleaningRecord record = new CleaningRecord();
        record.setUserId(userId);
        record.setBuildingId(user.getBuildingId());
        record.setCleaningPointId(result.getCleaningPointId());
        record.setPhotoUrl(photoUrl);
        record.setPointsEarned(earnedPoints);

        CleaningRecord savedRecord = cleaningRecordRepository.save(record);

        if (result.isShouldAwardPoints()) {
            userService.updatePoints(userId, pointsPerClean);
            log.info("用户 {} 获得 {} 积分", userId, pointsPerClean);

            if (user.getBuildingId() != null) {
                buildingService.updatePoints(user.getBuildingId(), pointsPerClean);
                log.info("楼栋 {} 获得 {} 积分", user.getBuildingId(), pointsPerClean);
            }

            updateCommunityStats();
        } else {
            log.info("用户 {} 打卡但未获得积分: {}", userId, result.getMessage());
        }

        return new CleaningResponse(
                savedRecord.getId(),
                result.getCleaningPointId(),
                result.isShouldAwardPoints(),
                earnedPoints,
                result.getMessage()
        );
    }

    private void updateCommunityStats() {
        Community community = communityRepository.findById(1L)
                .orElseGet(() -> {
                    Community c = new Community();
                    c.setId(1L);
                    return c;
                });
        community.setTotalCleanliness(community.getTotalCleanliness() + pointsPerClean);
        community.setTotalRecords(community.getTotalRecords() + 1);
        communityRepository.save(community);
    }
}
