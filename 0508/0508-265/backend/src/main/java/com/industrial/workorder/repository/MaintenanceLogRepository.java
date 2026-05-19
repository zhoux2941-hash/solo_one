package com.industrial.workorder.repository;

import com.industrial.workorder.entity.MaintenanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {
    List<MaintenanceLog> findByWorkOrderId(Long workOrderId);
    List<MaintenanceLog> findByDeviceId(Long deviceId);
    List<MaintenanceLog> findByMaintainerId(Long maintainerId);
}
