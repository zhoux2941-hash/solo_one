package com.petclean.service;

import com.petclean.entity.CleaningPoint;
import com.petclean.entity.Notification;
import com.petclean.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }

    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public Notification createNotification(Long userId, Long cleaningPointId, String message) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setCleaningPointId(cleaningPointId);
        notification.setMessage(message);
        notification.setIsRead(false);
        Notification saved = notificationRepository.save(notification);
        log.info("创建通知: 用户ID={}, 清理点ID={}, 消息={}", userId, cleaningPointId, message);
        return saved;
    }

    @Transactional
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("通知不存在"));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        for (Notification notification : unread) {
            notification.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    public void sendCleaningReminder(CleaningPoint point) {
        if (point.getLastCleanUserId() != null) {
            String message = String.format(
                    "您之前清理的位置（纬度：%s，经度：%s）超过48小时未打卡，且检测到新的粪便，请再次清理！",
                    point.getLatitude(), point.getLongitude()
            );
            createNotification(point.getLastCleanUserId(), point.getId(), message);
        }
    }
}
