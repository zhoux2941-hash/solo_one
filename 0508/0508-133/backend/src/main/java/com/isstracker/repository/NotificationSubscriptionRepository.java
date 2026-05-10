package com.isstracker.repository;

import com.isstracker.entity.NotificationSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationSubscriptionRepository extends JpaRepository<NotificationSubscription, Long> {
    
    List<NotificationSubscription> findByUserIdentifier(String userIdentifier);
    
    List<NotificationSubscription> findByIsActiveTrue();
    
    List<NotificationSubscription> findByUserIdentifierAndIsActiveTrue(String userIdentifier);
    
    Optional<NotificationSubscription> findByUserIdentifierAndLatitudeAndLongitude(
            String userIdentifier, Double latitude, Double longitude);
}
