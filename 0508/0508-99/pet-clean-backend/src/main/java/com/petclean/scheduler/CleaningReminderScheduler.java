package com.petclean.scheduler;

import com.petclean.entity.CleaningPoint;
import com.petclean.service.CleaningPointService;
import com.petclean.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CleaningReminderScheduler {

    private final CleaningPointService cleaningPointService;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 3600000)
    public void checkExpiredCleaningPoints() {
        log.info("开始检查过期清理点...");
        
        List<CleaningPoint> expiredPoints = cleaningPointService.getExpiredCleaningPoints();
        log.info("发现 {} 个过期清理点", expiredPoints.size());

        for (CleaningPoint point : expiredPoints) {
            if (point.getLastCleanUserId() != null) {
                notificationService.sendCleaningReminder(point);
            }
        }
        
        log.info("过期清理点检查完成");
    }
}
