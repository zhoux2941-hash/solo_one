package com.lawfirm.caseManagement.service;

import com.lawfirm.caseManagement.entity.Case;
import com.lawfirm.caseManagement.entity.Notification;
import com.lawfirm.caseManagement.repository.CaseRepository;
import com.lawfirm.caseManagement.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CaseRepository caseRepository;

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Notification> getPendingNotifications() {
        return notificationRepository.findPendingNotifications();
    }

    public List<Notification> getNotificationsByCase(Long caseId) {
        return notificationRepository.findByCaseEntityIdOrderByCreatedAtDesc(caseId);
    }

    @Transactional
    public Notification createNotification(Case caseEntity, String alertLevel, Long remainingDays) {
        Notification notification = new Notification();
        notification.setCaseEntity(caseEntity);
        notification.setCaseNumber(caseEntity.getCaseNumber());
        notification.setLawyer(caseEntity.getLawyer());
        notification.setParty(caseEntity.getParty());
        notification.setAlertLevel(alertLevel);
        notification.setRemainingDays(remainingDays.intValue());
        notification.setDeadlineDate(LocalDateTime.of(caseEntity.getStatuteOfLimitationsDeadline(), LocalTime.MIDNIGHT));

        String message = generateNotificationMessage(caseEntity, alertLevel, remainingDays);
        notification.setMessage(message);
        notification.setNotificationType(getNotificationType(alertLevel));
        notification.setStatus("PENDING");

        return notificationRepository.save(notification);
    }

    private String generateNotificationMessage(Case caseEntity, String alertLevel, Long remainingDays) {
        String urgency = "";
        switch (alertLevel) {
            case "紧急":
                urgency = "【紧急提醒】";
                break;
            case "重要":
                urgency = "【重要提醒】";
                break;
            case "提醒":
                urgency = "【温馨提醒】";
                break;
            default:
                urgency = "【提醒】";
        }

        return String.format("%s案件「%s」（当事人：%s）诉讼时效还有 %d 天到期，请及时处理！承办律师：%s",
                urgency, caseEntity.getCaseNumber(), caseEntity.getParty(), remainingDays, caseEntity.getLawyer());
    }

    private String getNotificationType(String alertLevel) {
        switch (alertLevel) {
            case "紧急":
                return "URGENT";
            case "重要":
                return "IMPORTANT";
            case "提醒":
                return "NORMAL";
            default:
                return "OTHER";
        }
    }

    @Transactional
    public Notification sendNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("通知不存在"));

        simulateSending(notification);

        notification.setStatus("SENT");
        notification.setSentAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    @Transactional
    public List<Notification> sendAllPendingNotifications() {
        List<Notification> pending = notificationRepository.findPendingNotifications();
        List<Notification> sent = new ArrayList<>();

        for (Notification notification : pending) {
            simulateSending(notification);
            notification.setStatus("SENT");
            notification.setSentAt(LocalDateTime.now());
            sent.add(notificationRepository.save(notification));
        }

        return sent;
    }

    private void simulateSending(Notification notification) {
        System.out.println("========================================");
        System.out.println("正在发送通知:");
        System.out.println("接收律师: " + notification.getLawyer());
        System.out.println("案件编号: " + notification.getCaseNumber());
        System.out.println("当事人: " + notification.getParty());
        System.out.println("提醒级别: " + notification.getAlertLevel());
        System.out.println("剩余天数: " + notification.getRemainingDays());
        System.out.println("消息内容: " + notification.getMessage());
        System.out.println("========================================");

        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void scanAndCreateNotifications() {
        System.out.println("开始扫描即将到期的案件...");

        List<Case> allCases = caseRepository.findAll();
        LocalDate today = LocalDate.now();

        for (Case caseEntity : allCases) {
            if (caseEntity.getStatus() != null && caseEntity.getStatus().equals("已结案")) {
                continue;
            }

            Long remainingDays = caseEntity.getRemainingDays();
            if (remainingDays == null || remainingDays < 0) {
                continue;
            }

            String alertLevel = caseEntity.getAlertLevel();
            if (!"正常".equals(alertLevel)) {
                List<Notification> existingNotifications = notificationRepository
                        .findByCaseEntityIdOrderByCreatedAtDesc(caseEntity.getId());

                boolean alreadyNotified = existingNotifications.stream()
                        .anyMatch(n -> n.getAlertLevel().equals(alertLevel));

                if (!alreadyNotified) {
                    createNotification(caseEntity, alertLevel, remainingDays);
                    System.out.printf("为案件 %s 创建 %s 级别通知%n", caseEntity.getCaseNumber(), alertLevel);
                }
            }
        }

        System.out.println("案件扫描完成");
    }

    public Map<String, Object> getNotificationStats() {
        Map<String, Object> stats = new HashMap<>();
        List<Notification> all = notificationRepository.findAllByOrderByCreatedAtDesc();

        long pendingCount = all.stream().filter(n -> "PENDING".equals(n.getStatus())).count();
        long sentCount = all.stream().filter(n -> "SENT".equals(n.getStatus())).count();
        long urgentCount = all.stream().filter(n -> "紧急".equals(n.getAlertLevel())).count();
        long importantCount = all.stream().filter(n -> "重要".equals(n.getAlertLevel())).count();

        stats.put("total", all.size());
        stats.put("pending", pendingCount);
        stats.put("sent", sentCount);
        stats.put("urgent", urgentCount);
        stats.put("important", importantCount);

        return stats;
    }

    @Transactional
    public void generateNotificationsForExpiringCases() {
        List<Case> expiringCases = caseRepository.findCasesExpiringBefore(LocalDate.now().plusDays(30));

        for (Case caseEntity : expiringCases) {
            if (caseEntity.getStatus() != null && caseEntity.getStatus().equals("已结案")) {
                continue;
            }

            Long remainingDays = caseEntity.getRemainingDays();
            if (remainingDays == null || remainingDays < 0) {
                continue;
            }

            String alertLevel = caseEntity.getAlertLevel();
            if (!"正常".equals(alertLevel)) {
                List<Notification> existingNotifications = notificationRepository
                        .findByCaseEntityIdOrderByCreatedAtDesc(caseEntity.getId());

                boolean alreadyNotified = existingNotifications.stream()
                        .anyMatch(n -> n.getAlertLevel().equals(alertLevel));

                if (!alreadyNotified) {
                    createNotification(caseEntity, alertLevel, remainingDays);
                }
            }
        }
    }
}
