package com.logistics.track.scheduler;

import com.logistics.track.dto.AnomalyPackageDTO;
import com.logistics.track.service.AnomalyDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnomalyDetectionScheduler {

    private final AnomalyDetectionService anomalyDetectionService;

    @Value("${scheduling.enabled:true}")
    private boolean schedulingEnabled;

    @Scheduled(cron = "0 */15 * * * ?")
    public void detectAnomaliesPeriodically() {
        if (!schedulingEnabled) {
            log.debug("定时任务已禁用");
            return;
        }
        
        log.info("开始执行周期性异常检测（每15分钟）");
        try {
            List<AnomalyPackageDTO> anomalies = anomalyDetectionService.getAnomalyList();
            if (!anomalies.isEmpty()) {
                log.warn("检测到 {} 个异常包裹需要关注", anomalies.size());
                for (AnomalyPackageDTO anomaly : anomalies) {
                    log.warn("异常包裹: {} [{} -> {}], 当前时长: {}小时, Z分数: {}", 
                            anomaly.getPackageNo(), 
                            anomaly.getSenderCity(), 
                            anomaly.getReceiverCity(),
                            anomaly.getCurrentDurationHours(),
                            anomaly.getZScore());
                }
            }
            log.info("异常检测执行完成");
        } catch (Exception e) {
            log.error("异常检测执行失败: {}", e.getMessage(), e);
        }
    }
}
