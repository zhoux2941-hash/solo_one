package com.logistics.track.scheduler;

import com.logistics.track.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StuckCenterScheduler {

    private final StatisticsService statisticsService;

    @Value("${scheduling.enabled:true}")
    private boolean schedulingEnabled;

    @Scheduled(cron = "0 0 * * * ?")
    public void calculateStuckCentersHourly() {
        if (!schedulingEnabled) {
            log.debug("定时任务已禁用");
            return;
        }
        
        log.info("开始执行每小时滞留中心计算任务");
        try {
            statisticsService.calculateAndCacheStuckCenters();
            log.info("滞留中心计算任务执行完成");
        } catch (Exception e) {
            log.error("滞留中心计算任务执行失败: {}", e.getMessage(), e);
        }
    }

    @Scheduled(initialDelay = 30000, fixedRate = Long.MAX_VALUE)
    public void calculateStuckCentersOnStartup() {
        if (!schedulingEnabled) {
            return;
        }
        
        log.info("启动时执行滞留中心计算任务");
        try {
            statisticsService.calculateAndCacheStuckCenters();
            log.info("启动时滞留中心计算任务执行完成");
        } catch (Exception e) {
            log.error("启动时滞留中心计算任务执行失败: {}", e.getMessage(), e);
        }
    }
}
