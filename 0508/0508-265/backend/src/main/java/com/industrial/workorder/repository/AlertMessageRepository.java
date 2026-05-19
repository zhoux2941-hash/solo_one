package com.industrial.workorder.repository;

import com.industrial.workorder.entity.AlertMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertMessageRepository extends JpaRepository<AlertMessage, Long> {
    List<AlertMessage> findByReadFlagFalse();
    List<AlertMessage> findByDeviceId(Long deviceId);
    List<AlertMessage> findByLevel(String level);
    List<AlertMessage> findTop10ByOrderByAlertTimeDesc();
}
