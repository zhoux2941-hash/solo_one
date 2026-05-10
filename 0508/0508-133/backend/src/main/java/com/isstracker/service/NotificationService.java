package com.isstracker.service;

import com.isstracker.dto.NotificationRequest;
import com.isstracker.entity.NotificationSubscription;
import com.isstracker.repository.NotificationSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    @Autowired
    private NotificationSubscriptionRepository subscriptionRepository;
    
    @Transactional
    public NotificationSubscription createOrUpdateSubscription(NotificationRequest request) {
        String userIdentifier = request.getUserIdentifier();
        if (userIdentifier == null || userIdentifier.isEmpty()) {
            userIdentifier = generateUserIdentifier();
        }
        
        Optional<NotificationSubscription> existingOpt = subscriptionRepository
                .findByUserIdentifierAndLatitudeAndLongitude(
                        userIdentifier, request.getLatitude(), request.getLongitude());
        
        NotificationSubscription subscription;
        if (existingOpt.isPresent()) {
            subscription = existingOpt.get();
            updateSubscriptionFromRequest(subscription, request);
            logger.info("Updating existing subscription for user: {}", userIdentifier);
        } else {
            subscription = new NotificationSubscription();
            subscription.setUserIdentifier(userIdentifier);
            subscription.setLatitude(request.getLatitude());
            subscription.setLongitude(request.getLongitude());
            updateSubscriptionFromRequest(subscription, request);
            logger.info("Creating new subscription for user: {}", userIdentifier);
        }
        
        return subscriptionRepository.save(subscription);
    }
    
    private void updateSubscriptionFromRequest(NotificationSubscription subscription, NotificationRequest request) {
        if (request.getLocationName() != null) {
            subscription.setLocationName(request.getLocationName());
        }
        if (request.getNotifyIssPass() != null) {
            subscription.setNotifyIssPass(request.getNotifyIssPass());
        }
        if (request.getNotifyIridiumFlare() != null) {
            subscription.setNotifyIridiumFlare(request.getNotifyIridiumFlare());
        }
        if (request.getMinBrightness() != null) {
            subscription.setMinBrightness(request.getMinBrightness());
        }
        if (request.getMinElevation() != null) {
            subscription.setMinElevation(request.getMinElevation());
        }
        if (request.getNotificationMethod() != null) {
            subscription.setNotificationMethod(request.getNotificationMethod());
        }
        if (request.getNotificationTarget() != null) {
            subscription.setNotificationTarget(request.getNotificationTarget());
        }
        if (request.getAdvanceNoticeMinutes() != null) {
            subscription.setAdvanceNoticeMinutes(request.getAdvanceNoticeMinutes());
        }
        if (request.getIsActive() != null) {
            subscription.setIsActive(request.getIsActive());
        }
    }
    
    public List<NotificationSubscription> getUserSubscriptions(String userIdentifier) {
        if (userIdentifier == null || userIdentifier.isEmpty()) {
            return List.of();
        }
        return subscriptionRepository.findByUserIdentifierAndIsActiveTrue(userIdentifier);
    }
    
    public Optional<NotificationSubscription> getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id);
    }
    
    @Transactional
    public boolean deleteSubscription(Long id) {
        Optional<NotificationSubscription> subscriptionOpt = subscriptionRepository.findById(id);
        if (subscriptionOpt.isPresent()) {
            subscriptionRepository.delete(subscriptionOpt.get());
            logger.info("Deleted subscription with id: {}", id);
            return true;
        }
        return false;
    }
    
    @Transactional
    public boolean toggleSubscription(Long id, boolean active) {
        Optional<NotificationSubscription> subscriptionOpt = subscriptionRepository.findById(id);
        if (subscriptionOpt.isPresent()) {
            NotificationSubscription subscription = subscriptionOpt.get();
            subscription.setIsActive(active);
            subscriptionRepository.save(subscription);
            logger.info("Toggled subscription {} to {}", id, active ? "active" : "inactive");
            return true;
        }
        return false;
    }
    
    private String generateUserIdentifier() {
        return "user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
    
    public List<NotificationSubscription> getAllActiveSubscriptions() {
        return subscriptionRepository.findByIsActiveTrue();
    }
}
