package com.lawfirm.caseManagement.controller;

import com.lawfirm.caseManagement.entity.Notification;
import com.lawfirm.caseManagement.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public List<Notification> getAllNotifications() {
        return notificationService.getAllNotifications();
    }

    @GetMapping("/pending")
    public List<Notification> getPendingNotifications() {
        return notificationService.getPendingNotifications();
    }

    @GetMapping("/case/{caseId}")
    public List<Notification> getNotificationsByCase(@PathVariable Long caseId) {
        return notificationService.getNotificationsByCase(caseId);
    }

    @GetMapping("/stats")
    public Map<String, Object> getNotificationStats() {
        return notificationService.getNotificationStats();
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<Notification> sendNotification(@PathVariable Long id) {
        try {
            Notification notification = notificationService.sendNotification(id);
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/send-all")
    public ResponseEntity<List<Notification>> sendAllPendingNotifications() {
        List<Notification> sent = notificationService.sendAllPendingNotifications();
        return ResponseEntity.ok(sent);
    }

    @PostMapping("/generate")
    public ResponseEntity<String> generateNotifications() {
        notificationService.generateNotificationsForExpiringCases();
        return ResponseEntity.ok("通知生成完成");
    }

    @PostMapping("/scan")
    public ResponseEntity<String> scanAndCreateNotifications() {
        notificationService.scanAndCreateNotifications();
        return ResponseEntity.ok("扫描完成");
    }
}
