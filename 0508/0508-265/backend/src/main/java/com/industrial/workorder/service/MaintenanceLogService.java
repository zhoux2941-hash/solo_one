package com.industrial.workorder.service;

import com.industrial.workorder.entity.MaintenanceLog;
import com.industrial.workorder.entity.WorkOrder;
import com.industrial.workorder.exception.ConcurrentOperationException;
import com.industrial.workorder.repository.DeviceRepository;
import com.industrial.workorder.repository.MaintenanceLogRepository;
import com.industrial.workorder.repository.UserRepository;
import com.industrial.workorder.repository.WorkOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MaintenanceLogService {

    @Autowired
    private MaintenanceLogRepository maintenanceLogRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    public List<MaintenanceLog> findAll() {
        List<MaintenanceLog> logs = maintenanceLogRepository.findAll();
        logs.forEach(this::populateTransientFields);
        return logs;
    }

    public Optional<MaintenanceLog> findById(Long id) {
        Optional<MaintenanceLog> logOpt = maintenanceLogRepository.findById(id);
        logOpt.ifPresent(this::populateTransientFields);
        return logOpt;
    }

    public List<MaintenanceLog> findByWorkOrderId(Long workOrderId) {
        List<MaintenanceLog> logs = maintenanceLogRepository.findByWorkOrderId(workOrderId);
        logs.forEach(this::populateTransientFields);
        return logs;
    }

    public List<MaintenanceLog> findByDeviceId(Long deviceId) {
        List<MaintenanceLog> logs = maintenanceLogRepository.findByDeviceId(deviceId);
        logs.forEach(this::populateTransientFields);
        return logs;
    }

    public List<MaintenanceLog> findByMaintainerId(Long maintainerId) {
        List<MaintenanceLog> logs = maintenanceLogRepository.findByMaintainerId(maintainerId);
        logs.forEach(this::populateTransientFields);
        return logs;
    }

    @Transactional
    public MaintenanceLog save(MaintenanceLog log) {
        Optional<WorkOrder> orderOpt = workOrderRepository.findById(log.getWorkOrderId());
        if (!orderOpt.isPresent()) {
            throw new ConcurrentOperationException("工单不存在");
        }

        WorkOrder order = orderOpt.get();
        
        if (!"IN_PROGRESS".equals(order.getStatus())) {
            throw new ConcurrentOperationException("该工单当前状态为 [" + order.getStatus() + "]，只有进行中的工单可以提交维修记录");
        }
        
        if ("COMPLETED".equals(order.getStatus())) {
            throw new ConcurrentOperationException("该工单已完成，不可重复提交维修记录");
        }

        MaintenanceLog saved = maintenanceLogRepository.save(log);
        populateTransientFields(saved);
        
        if (log.getResult() != null && "SUCCESS".equals(log.getResult())) {
            order.setStatus("COMPLETED");
            workOrderRepository.save(order);
            
            deviceRepository.findById(log.getDeviceId()).ifPresent(device -> {
                device.setStatus("NORMAL");
                deviceRepository.save(device);
            });
        }
        
        return saved;
    }

    public void deleteById(Long id) {
        maintenanceLogRepository.deleteById(id);
    }

    private void populateTransientFields(MaintenanceLog log) {
        deviceRepository.findById(log.getDeviceId()).ifPresent(d -> log.setDeviceName(d.getDeviceName()));
        userRepository.findById(log.getMaintainerId()).ifPresent(u -> log.setMaintainerName(u.getRealName()));
    }
}
