package com.psychiatric.repository;

import com.psychiatric.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByIsReadOrderByAlertTimeDesc(Boolean isRead);
    List<Alert> findByBraceletIdOrderByAlertTimeDesc(String braceletId);
}
