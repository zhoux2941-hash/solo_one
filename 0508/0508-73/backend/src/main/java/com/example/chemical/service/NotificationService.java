package com.example.chemical.service;

import com.example.chemical.entity.Application;
import com.example.chemical.entity.Notification;
import com.example.chemical.entity.User;
import com.example.chemical.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public void sendOverdueNotification(User user, Application application) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("危化品超期提醒");
        String content = String.format("您领用的【%s】(CAS:%s)已超期未归还，计划归还时间：%s，请尽快归还并说明原因。",
                application.getChemical().getName(),
                application.getChemical().getCasNumber(),
                application.getPlannedReturnDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        notification.setContent(content);
        notification.setType(Notification.NotificationType.OVERDUE_REMINDER);
        notification.setApplication(application);
        notification.setIsRead(false);
        
        notificationRepository.save(notification);
    }

    @Transactional
    public void sendReturnReminder(User user, Application application) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("危化品归还提醒");
        String content = String.format("您领用的【%s】(CAS:%s)即将到期，请于%s前完成归还。",
                application.getChemical().getName(),
                application.getChemical().getCasNumber(),
                application.getPlannedReturnDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        notification.setContent(content);
        notification.setType(Notification.NotificationType.RETURN_REMINDER);
        notification.setApplication(application);
        notification.setIsRead(false);
        
        notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    @Transactional
    public int markAsRead(Long notificationId, Long userId) {
        return notificationRepository.markAsRead(notificationId, userId);
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsRead(userId);
    }
}
