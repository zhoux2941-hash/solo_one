package com.zoo.monitoring.service;

import com.zoo.monitoring.entity.Alert;
import com.zoo.monitoring.entity.Bird;
import com.zoo.monitoring.entity.MonitoringData;
import com.zoo.monitoring.repository.AlertRepository;
import com.zoo.monitoring.repository.BirdRepository;
import com.zoo.monitoring.repository.MonitoringDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MonitoringService {
    @Autowired
    private MonitoringDataRepository monitoringDataRepository;

    @Autowired
    private BirdRepository birdRepository;

    @Autowired
    private AlertRepository alertRepository;

    private static final double TEMPERATURE_THRESHOLD = 41.0;
    private static final double WILD_BIRD_INCREASE_THRESHOLD = 2.0;

    public List<MonitoringData> findAll() {
        List<MonitoringData> dataList = monitoringDataRepository.findAll();
        for (MonitoringData data : dataList) {
            enrichBirdInfo(data);
        }
        return dataList;
    }

    public Page<MonitoringData> findAll(Pageable pageable) {
        Page<MonitoringData> page = monitoringDataRepository.findAll(pageable);
        for (MonitoringData data : page.getContent()) {
            enrichBirdInfo(data);
        }
        return page;
    }

    public Optional<MonitoringData> findById(Long id) {
        Optional<MonitoringData> data = monitoringDataRepository.findById(id);
        data.ifPresent(this::enrichBirdInfo);
        return data;
    }

    public List<MonitoringData> findByBirdId(Long birdId) {
        List<MonitoringData> dataList = monitoringDataRepository.findByBirdIdOrderByMonitorTimeDesc(birdId);
        for (MonitoringData data : dataList) {
            enrichBirdInfo(data);
        }
        return dataList;
    }

    private void enrichBirdInfo(MonitoringData data) {
        birdRepository.findById(data.getBirdId()).ifPresent(bird -> {
            data.setBirdNo(bird.getBirdNo());
            data.setSpecies(bird.getSpecies());
            data.setCageNo(bird.getCageNo());
        });
    }

    @Transactional
    public MonitoringData save(MonitoringData data) {
        MonitoringData saved = monitoringDataRepository.save(data);
        enrichBirdInfo(saved);
        checkAndTriggerAlerts(saved);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        monitoringDataRepository.deleteById(id);
    }

    private void checkAndTriggerAlerts(MonitoringData data) {
        Bird bird = birdRepository.findById(data.getBirdId()).orElse(null);
        if (bird == null) return;

        boolean needQuarantine = false;
        StringBuilder description = new StringBuilder();

        if (data.getTemperature() > TEMPERATURE_THRESHOLD) {
            needQuarantine = true;
            description.append("体温异常: ").append(data.getTemperature()).append("℃; ");
        }

        if (data.getPcrPositive()) {
            needQuarantine = true;
            description.append("PCR检测阳性; ");
        }

        if (needQuarantine) {
            createAlert(bird, "立即隔离", "一级预警", description.toString());
            bird.setIsQuarantined(true);
            bird.setHealthStatus("隔离中");
            birdRepository.save(bird);
        }

        if (data.getWildBirdCount() != null) {
            double increaseRate = checkWildBirdIncrease(data.getWildBirdCount());
            if (increaseRate > WILD_BIRD_INCREASE_THRESHOLD) {
                createAlert(bird, "野生鸟类异常增多", "二级预警",
                        "周边野生鸟类观测数量异常增多，同比增长" + String.format("%.1f", increaseRate * 100) + "%");
            }
        }
    }

    private double checkWildBirdIncrease(Integer currentCount) {
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);
        Double avgHistory = monitoringDataRepository.getAverageWildBirdCount(oneWeekAgo, LocalDateTime.now());
        if (avgHistory == null || avgHistory == 0) {
            return 0;
        }
        return (currentCount - avgHistory) / avgHistory;
    }

    private void createAlert(Bird bird, String alertType, String alertLevel, String description) {
        Alert alert = new Alert();
        alert.setBirdId(bird.getId());
        alert.setBirdNo(bird.getBirdNo());
        alert.setSpecies(bird.getSpecies());
        alert.setCageNo(bird.getCageNo());
        alert.setAlertType(alertType);
        alert.setAlertLevel(alertLevel);
        alert.setDescription(description);
        alertRepository.save(alert);
    }
}
