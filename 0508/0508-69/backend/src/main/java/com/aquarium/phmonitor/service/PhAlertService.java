package com.aquarium.phmonitor.service;

import com.aquarium.phmonitor.dto.AlertMessage;
import com.aquarium.phmonitor.entity.PhRecord;
import com.aquarium.phmonitor.repository.PhRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@EnableScheduling
public class PhAlertService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private PhRecordRepository phRecordRepository;

    @Value("${app.ph.min:7.8}")
    private double phMin;

    @Value("${app.ph.max:8.4}")
    private double phMax;

    private final List<String> tankNames = Arrays.asList(
        "珊瑚缸", "鲨鱼缸", "热带鱼缸", "水母缸", "海龟缸", "企鹅缸", "海獭缸", "巨藻缸"
    );

    private Map<String, Double> lastPhValues = new ConcurrentHashMap<>();
    private Map<String, Integer> consecutiveAlerts = new ConcurrentHashMap<>();
    private Random random = new Random();

    @PostConstruct
    public void init() {
        for (String tank : tankNames) {
            lastPhValues.put(tank, (phMin + phMax) / 2.0);
            consecutiveAlerts.put(tank, 0);
        }
        loadLastValuesFromDatabase();
    }

    private void loadLastValuesFromDatabase() {
        try {
            for (String tank : tankNames) {
                List<PhRecord> records = phRecordRepository.findLatestByTankName(tank);
                if (records != null && !records.isEmpty()) {
                    PhRecord latest = records.get(0);
                    lastPhValues.put(tank, latest.getPhValue());
                }
            }
        } catch (Exception e) {
            System.out.println("从数据库加载初始值失败: " + e.getMessage());
        }
    }

    @Scheduled(fixedRate = 10000)
    public void monitorAndPushAlerts() {
        LocalDateTime now = LocalDateTime.now();

        for (String tank : tankNames) {
            double currentPh = simulateNewPhValue(tank);
            lastPhValues.put(tank, currentPh);

            boolean isAbnormal = currentPh < phMin || currentPh > phMax;
            if (isAbnormal) {
                int count = consecutiveAlerts.getOrDefault(tank, 0) + 1;
                consecutiveAlerts.put(tank, count);

                AlertMessage alert = createAlertMessage(tank, currentPh, count, now);
                pushAlert(alert);
            } else {
                consecutiveAlerts.put(tank, 0);
            }
        }
    }

    private double simulateNewPhValue(String tankName) {
        double lastPh = lastPhValues.get(tankName);
        
        double volatility;
        double driftChance;
        
        if ("珊瑚缸".equals(tankName) || "水母缸".equals(tankName)) {
            volatility = 0.15;
            driftChance = 0.15;
        } else {
            volatility = 0.06;
            driftChance = 0.03;
        }

        double drift = random.nextGaussian() * volatility;
        double newPh = lastPh + drift;

        if (random.nextDouble() < driftChance) {
            double direction = random.nextBoolean() ? 1 : -1;
            newPh += direction * (0.2 + random.nextDouble() * 0.3);
        }

        double center = (phMin + phMax) / 2.0;
        if (newPh < phMin - 0.8) {
            newPh = center + (random.nextDouble() - 0.3) * 0.4;
        } else if (newPh > phMax + 0.8) {
            newPh = center + (random.nextDouble() - 0.7) * 0.4;
        }

        if (random.nextDouble() < 0.1) {
            double pullBack = (center - newPh) * 0.15;
            newPh += pullBack;
        }

        return Math.round(newPh * 100.0) / 100.0;
    }

    private AlertMessage createAlertMessage(String tankName, double currentPh, 
                                             int consecutiveCount, LocalDateTime timestamp) {
        String alertType;
        String level;
        String suggestion;

        if (currentPh < phMin) {
            alertType = "pH值偏低";
            if (consecutiveCount >= 3) {
                level = "danger";
                suggestion = generateCriticalLowSuggestion(tankName);
            } else {
                level = "warning";
                suggestion = generateLowSuggestion(tankName);
            }
        } else {
            alertType = "pH值偏高";
            if (consecutiveCount >= 3) {
                level = "danger";
                suggestion = generateCriticalHighSuggestion(tankName);
            } else {
                level = "warning";
                suggestion = generateHighSuggestion(tankName);
            }
        }

        return new AlertMessage(
            tankName,
            currentPh,
            phMin,
            phMax,
            alertType,
            suggestion,
            timestamp,
            level
        );
    }

    private String generateLowSuggestion(String tankName) {
        List<String> suggestions = Arrays.asList(
            "检查CO2注入系统是否过量",
            "检查水循环系统是否正常运行",
            "监测生物活动，观察是否有异常",
            "检查pH探头校准状态",
            "考虑添加缓冲溶液稳定pH值"
        );
        return suggestions.get(random.nextInt(suggestions.size()));
    }

    private String generateCriticalLowSuggestion(String tankName) {
        return "⚠️ 紧急：pH值持续偏低！请立即：1) 停止CO2注入 2) 检查曝气系统 3) 紧急换水 4) 通知值班人员";
    }

    private String generateHighSuggestion(String tankName) {
        List<String> suggestions = Arrays.asList(
            "检查CO2系统是否关闭或供气不足",
            "增加水的曝气和搅拌",
            "监测生物呼吸活动",
            "检查pH探头是否需要清洗",
            "考虑添加适量二氧化碳"
        );
        return suggestions.get(random.nextInt(suggestions.size()));
    }

    private String generateCriticalHighSuggestion(String tankName) {
        return "⚠️ 紧急：pH值持续偏高！请立即：1) 检查并开启CO2系统 2) 减少曝气 3) 紧急换水 4) 通知值班人员";
    }

    private void pushAlert(AlertMessage alert) {
        try {
            messagingTemplate.convertAndSend("/topic/ph-alerts", alert);
            System.out.println("[ALERT] " + alert.getTimestamp() + " - " + 
                alert.getTankName() + " pH=" + alert.getCurrentPh() + 
                " (" + alert.getAlertType() + ")");
        } catch (Exception e) {
            System.out.println("推送告警失败: " + e.getMessage());
        }
    }

    public Map<String, Double> getCurrentPhValues() {
        return new HashMap<>(lastPhValues);
    }

    public Map<String, Integer> getConsecutiveAlerts() {
        return new HashMap<>(consecutiveAlerts);
    }
}
