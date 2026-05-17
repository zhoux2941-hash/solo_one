package com.metro.inspection.service;

import com.metro.inspection.entity.InspectionRecord;
import com.metro.inspection.entity.WorkOrder;
import com.metro.inspection.entity.WorkOrderStatus;
import com.metro.inspection.repository.WorkOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class WorkOrderService {

    @Autowired
    private WorkOrderRepository workOrderRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private final AtomicInteger orderCounter = new AtomicInteger(0);

    @Transactional
    public WorkOrder createWorkOrder(InspectionRecord inspectionRecord) {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setOrderNo(generateOrderNo());
        workOrder.setSection(inspectionRecord.getSection());
        workOrder.setMileage(inspectionRecord.getMileage());
        workOrder.setDamageType(inspectionRecord.getDamageType());
        workOrder.setSeverityLevel(inspectionRecord.getSeverityLevel());
        workOrder.setSuggestedRepairTime(inspectionRecord.getSuggestedRepairTime());
        workOrder.setStatus(WorkOrderStatus.PENDING);
        workOrder.setCreateTime(LocalDateTime.now());
        workOrder.setInspectionRecord(inspectionRecord);

        return workOrderRepository.save(workOrder);
    }

    private String generateOrderNo() {
        String date = LocalDateTime.now().format(DATE_FORMATTER);
        int count = orderCounter.incrementAndGet();
        return String.format("WO%s%03d", date, count);
    }

    public List<WorkOrder> getAllWorkOrders(String status) {
        if (status != null && !status.isEmpty()) {
            WorkOrderStatus orderStatus = WorkOrderStatus.valueOf(status);
            return workOrderRepository.findByStatus(orderStatus);
        }
        return workOrderRepository.findAll();
    }

    public Optional<WorkOrder> getWorkOrderByOrderNo(String orderNo) {
        return workOrderRepository.findByOrderNo(orderNo);
    }

    @Transactional
    public WorkOrder updateWorkOrderStatus(String orderNo, String status) {
        Optional<WorkOrder> optionalOrder = workOrderRepository.findByOrderNo(orderNo);
        if (optionalOrder.isPresent()) {
            WorkOrder workOrder = optionalOrder.get();
            workOrder.setStatus(WorkOrderStatus.valueOf(status));
            workOrder.setUpdateTime(LocalDateTime.now());
            return workOrderRepository.save(workOrder);
        }
        return null;
    }
}
