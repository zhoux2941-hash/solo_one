package com.example.chemical.controller;

import com.example.chemical.dto.Result;
import com.example.chemical.entity.Notification;
import com.example.chemical.entity.User;
import com.example.chemical.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public Result<List<Notification>> getMyNotifications(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        List<Notification> notifications = notificationService.getUserNotifications(user.getId());
        return Result.success(notifications);
    }

    @GetMapping("/unread")
    public Result<List<Notification>> getUnreadNotifications(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        List<Notification> notifications = notificationService.getUnreadNotifications(user.getId());
        return Result.success(notifications);
    }

    @GetMapping("/unread-count")
    public Result<Map<String, Object>> getUnreadCount(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        long count = notificationService.getUnreadCount(user.getId());
        Map<String, Object> result = new HashMap<>();
        result.put("count", count);
        return Result.success(result);
    }

    @PostMapping("/{id}/read")
    public Result<Void> markAsRead(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        int updated = notificationService.markAsRead(id, user.getId());
        if (updated > 0) {
            return Result.success();
        }
        return Result.error("Notification not found or not yours");
    }

    @PostMapping("/read-all")
    public Result<Void> markAllAsRead(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        notificationService.markAllAsRead(user.getId());
        return Result.success();
    }
}
