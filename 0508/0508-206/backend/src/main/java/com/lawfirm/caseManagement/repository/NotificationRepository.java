package com.lawfirm.caseManagement.repository;

import com.lawfirm.caseManagement.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByStatusOrderByCreatedAtDesc(String status);

    List<Notification> findByCaseEntityIdOrderByCreatedAtDesc(Long caseId);

    List<Notification> findByLawyerOrderByCreatedAtDesc(String lawyer);

    List<Notification> findAllByOrderByCreatedAtDesc();

    @Query("SELECT n FROM Notification n WHERE n.status = 'PENDING' ORDER BY n.createdAt ASC")
    List<Notification> findPendingNotifications();
}
