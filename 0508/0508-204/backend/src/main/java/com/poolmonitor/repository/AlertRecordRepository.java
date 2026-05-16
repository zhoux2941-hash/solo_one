package com.poolmonitor.repository;

import com.poolmonitor.entity.AlertRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRecordRepository extends JpaRepository<AlertRecord, Long> {

    List<AlertRecord> findByIsHandledOrderByAlertTimeDesc(Boolean isHandled);

    List<AlertRecord> findByAlertTimeBetweenOrderByAlertTimeDesc(LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT a FROM AlertRecord a ORDER BY a.alertTime DESC")
    List<AlertRecord> findAllOrderByAlertTimeDesc();

    List<AlertRecord> findTop10ByOrderByAlertTimeDesc();

    Optional<AlertRecord> findByAlertTypeAndIsHandled(String alertType, Boolean isHandled);

    List<AlertRecord> findByIsHandled(Boolean isHandled);
}