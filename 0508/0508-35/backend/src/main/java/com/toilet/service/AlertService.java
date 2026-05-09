package com.toilet.service;

import com.toilet.entity.Toilet;
import com.toilet.entity.ToiletStall;
import com.toilet.repository.ToiletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class AlertService {
    private static final Logger logger = LoggerFactory.getLogger(AlertService.class);
    private static final String ALERT_KEY = "toilet:low_paper_alerts";
    private static final int THRESHOLD = 20;

    @Autowired
    private ToiletRepository toiletRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void checkLowPaperAlerts() {
        logger.info("开始检测低余量厕位...");
        
        List<Map<String, Object>> alerts = new ArrayList<>();
        List<Toilet> toilets = toiletRepository.findAll();

        for (Toilet toilet : toilets) {
            for (ToiletStall stall : toilet.getStalls()) {
                if (stall.getPaperLevel() <= THRESHOLD) {
                    Map<String, Object> alert = new LinkedHashMap<>();
                    alert.put("id", stall.getId());
                    alert.put("toiletId", toilet.getId());
                    alert.put("toiletCode", toilet.getCode());
                    alert.put("stallCode", stall.getCode());
                    alert.put("location", toilet.getLocation());
                    alert.put("paperLevel", stall.getPaperLevel());
                    alert.put("position", toilet.getCode() + "-" + stall.getCode());
                    alert.put("detectTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                    alerts.add(alert);
                }
            }
        }

        if (!alerts.isEmpty()) {
            redisTemplate.opsForValue().set(ALERT_KEY, alerts, 60, TimeUnit.MINUTES);
            logger.info("发现 {} 个低余量厕位预警", alerts.size());
        } else {
            redisTemplate.delete(ALERT_KEY);
            logger.info("当前没有低余量厕位");
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAlerts() {
        Object cached = redisTemplate.opsForValue().get(ALERT_KEY);
        if (cached != null) {
            try {
                return (List<Map<String, Object>>) cached;
            } catch (Exception e) {
                logger.error("解析 Redis 预警数据失败", e);
            }
        }
        
        checkLowPaperAlerts();
        cached = redisTemplate.opsForValue().get(ALERT_KEY);
        if (cached != null) {
            try {
                return (List<Map<String, Object>>) cached;
            } catch (Exception e) {
                logger.error("解析 Redis 预警数据失败", e);
            }
        }
        
        return new ArrayList<>();
    }

    @Transactional
    public boolean refillPaper(Long stallId) {
        List<Toilet> toilets = toiletRepository.findAll();
        
        for (Toilet toilet : toilets) {
            for (ToiletStall stall : toilet.getStalls()) {
                if (stall.getId().equals(stallId)) {
                    stall.setPaperLevel(100);
                    stall.setLastUpdate(LocalDateTime.now());
                    toiletRepository.save(toilet);
                    
                    removeAlertFromRedis(stallId);
                    
                    logger.info("厕位 {}-{} 已补充厕纸，余量重置为 100%", toilet.getCode(), stall.getCode());
                    return true;
                }
            }
        }
        
        logger.warn("未找到厕位 ID: {}", stallId);
        return false;
    }

    @SuppressWarnings("unchecked")
    private void removeAlertFromRedis(Long stallId) {
        try {
            Object cached = redisTemplate.opsForValue().get(ALERT_KEY);
            if (cached != null) {
                List<Map<String, Object>> alerts = (List<Map<String, Object>>) cached;
                alerts.removeIf(alert -> stallId.equals(((Number) alert.get("id")).longValue()));
                
                if (alerts.isEmpty()) {
                    redisTemplate.delete(ALERT_KEY);
                } else {
                    redisTemplate.opsForValue().set(ALERT_KEY, alerts, 60, TimeUnit.MINUTES);
                }
            }
        } catch (Exception e) {
            logger.error("更新 Redis 预警列表失败", e);
        }
    }
}
