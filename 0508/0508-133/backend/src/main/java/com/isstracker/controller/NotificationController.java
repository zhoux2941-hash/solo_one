package com.isstracker.controller;

import com.isstracker.dto.NotificationRequest;
import com.isstracker.entity.NotificationSubscription;
import com.isstracker.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    @PostMapping("/subscribe")
    public ResponseEntity<?> createSubscription(@Valid @RequestBody NotificationRequest request) {
        NotificationSubscription subscription = notificationService.createOrUpdateSubscription(request);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "订阅已保存");
        response.put("subscription", subscription);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/user/{userIdentifier}")
    public ResponseEntity<?> getUserSubscriptions(@PathVariable String userIdentifier) {
        List<NotificationSubscription> subscriptions = notificationService.getUserSubscriptions(userIdentifier);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("userIdentifier", userIdentifier);
        response.put("total", subscriptions.size());
        response.put("subscriptions", subscriptions);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getSubscription(@PathVariable Long id) {
        Optional<NotificationSubscription> subscriptionOpt = notificationService.getSubscriptionById(id);
        
        if (subscriptionOpt.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("subscription", subscriptionOpt.get());
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "订阅不存在");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSubscription(@PathVariable Long id, @RequestBody NotificationRequest request) {
        Optional<NotificationSubscription> existingOpt = notificationService.getSubscriptionById(id);
        
        if (existingOpt.isPresent()) {
            NotificationSubscription existing = existingOpt.get();
            request.setUserIdentifier(existing.getUserIdentifier());
            if (request.getLatitude() == null) {
                request.setLatitude(existing.getLatitude());
            }
            if (request.getLongitude() == null) {
                request.setLongitude(existing.getLongitude());
            }
            
            NotificationSubscription updated = notificationService.createOrUpdateSubscription(request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "订阅已更新");
            response.put("subscription", updated);
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "订阅不存在");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubscription(@PathVariable Long id) {
        boolean deleted = notificationService.deleteSubscription(id);
        
        if (deleted) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "订阅已删除");
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "订阅不存在");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggleSubscription(@PathVariable Long id, @RequestParam boolean active) {
        boolean toggled = notificationService.toggleSubscription(id, active);
        
        if (toggled) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", active ? "订阅已激活" : "订阅已停用");
            response.put("active", active);
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "订阅不存在");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}
