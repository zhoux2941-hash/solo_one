package com.autorepair.service;

import com.autorepair.entity.WorkOrder;
import com.autorepair.entity.WorkOrderPart;
import com.autorepair.entity.WorkRecord;
import com.autorepair.repository.WorkOrderPartRepository;
import com.autorepair.repository.WorkOrderRepository;
import com.autorepair.repository.WorkRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class WorkOrderService {
    @Autowired
    private WorkOrderRepository workOrderRepository;
    
    @Autowired
    private WorkRecordRepository workRecordRepository;
    
    @Autowired
    private WorkOrderPartRepository workOrderPartRepository;
    
    @Autowired
    private PartService partService;
    
    public List<WorkOrder> list() {
        return workOrderRepository.findAll();
    }
    
    public List<WorkOrder> findByStatus(String status) {
        return workOrderRepository.findByStatus(status);
    }
    
    public List<WorkOrder> findByCustomerId(Long customerId) {
        return workOrderRepository.findByCustomerId(customerId);
    }
    
    public List<WorkOrder> search(String keyword) {
        return workOrderRepository.findByPlateNumberContainingOrOrderNoContaining(keyword, keyword);
    }
    
    public WorkOrder getById(Long id) {
        Optional<WorkOrder> optional = workOrderRepository.findById(id);
        return optional.orElse(null);
    }
    
    public List<WorkOrderPart> getOrderParts(Long orderId) {
        return workOrderPartRepository.findByWorkOrderId(orderId);
    }
    
    public List<WorkRecord> getWorkRecords(Long orderId) {
        return workRecordRepository.findByWorkOrderIdOrderByOperateTimeDesc(orderId);
    }
    
    @Transactional
    public WorkOrder create(WorkOrder workOrder) {
        if (workOrder.getVehicleId() != null) {
            Long activeCount = workOrderRepository.countActiveWorkOrdersByVehicleId(workOrder.getVehicleId());
            if (activeCount != null && activeCount > 0) {
                throw new RuntimeException("该车辆当前已有在修工单，请先完成或结算现有工单");
            }
        }
        String orderNo = "WO" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        workOrder.setOrderNo(orderNo);
        workOrder.setStatus("CREATED");
        workOrder.setInTime(LocalDateTime.now());
        workOrder.setPaidAmount(BigDecimal.ZERO);
        WorkOrder saved = workOrderRepository.save(workOrder);
        addWorkRecord(saved.getId(), orderNo, "创建工单", "系统");
        return saved;
    }
    
    @Transactional
    public WorkOrder assign(Long id, String assignTo) {
        WorkOrder workOrder = getById(id);
        if (workOrder != null) {
            workOrder.setStatus("ASSIGNED");
            workOrder.setAssignTo(assignTo);
            WorkOrder saved = workOrderRepository.save(workOrder);
            addWorkRecord(id, saved.getOrderNo(), "派工给：" + assignTo, "系统");
            return saved;
        }
        return null;
    }
    
    @Transactional
    public WorkOrder startWork(Long id) {
        WorkOrder workOrder = getById(id);
        if (workOrder != null) {
            workOrder.setStatus("WORKING");
            WorkOrder saved = workOrderRepository.save(workOrder);
            addWorkRecord(id, saved.getOrderNo(), "开始施工", workOrder.getAssignTo());
            return saved;
        }
        return null;
    }
    
    @Transactional
    public WorkOrder completeWork(Long id) {
        WorkOrder workOrder = getById(id);
        if (workOrder != null) {
            workOrder.setStatus("COMPLETED");
            workOrder.setOutTime(LocalDateTime.now());
            WorkOrder saved = workOrderRepository.save(workOrder);
            addWorkRecord(id, saved.getOrderNo(), "施工完成", workOrder.getAssignTo());
            return saved;
        }
        return null;
    }
    
    @Transactional
    public WorkOrder settle(Long id, BigDecimal discountAmount, BigDecimal paidAmount) {
        WorkOrder workOrder = getById(id);
        if (workOrder != null) {
            if (discountAmount == null) {
                discountAmount = BigDecimal.ZERO;
            }
            if (paidAmount == null) {
                paidAmount = BigDecimal.ZERO;
            }
            BigDecimal originalAmount = workOrder.getTotalAmount() != null ? 
                workOrder.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal actualTotal = originalAmount.subtract(discountAmount);
            if (actualTotal.compareTo(BigDecimal.ZERO) < 0) {
                actualTotal = BigDecimal.ZERO;
            }
            workOrder.setDiscountAmount(discountAmount);
            workOrder.setTotalAmount(actualTotal);
            workOrder.setPaidAmount(paidAmount);
            workOrder.setStatus("SETTLED");
            WorkOrder saved = workOrderRepository.save(workOrder);
            String remark = String.format("结算完成，原价：%s，优惠：%s，实收：%s", 
                originalAmount, discountAmount, paidAmount);
            addWorkRecord(id, saved.getOrderNo(), remark, "财务");
            return saved;
        }
        return null;
    }
    
    @Transactional
    public WorkOrderPart addPart(WorkOrderPart part) {
        partService.stockOut(part.getPartId(), part.getQuantity());
        WorkOrderPart saved = workOrderPartRepository.save(part);
        
        WorkOrder workOrder = getById(part.getWorkOrderId());
        if (workOrder != null) {
            workOrder.setPartsCost(workOrder.getPartsCost() == null ? 
                part.getTotalPrice() : workOrder.getPartsCost().add(part.getTotalPrice()));
            workOrder.setTotalAmount(workOrder.getLaborCost() != null ? 
                workOrder.getLaborCost().add(workOrder.getPartsCost()) : workOrder.getPartsCost());
            workOrderRepository.save(workOrder);
        }
        return saved;
    }
    
    private void addWorkRecord(Long orderId, String orderNo, String operation, String operator) {
        WorkRecord record = new WorkRecord();
        record.setWorkOrderId(orderId);
        record.setOrderNo(orderNo);
        record.setOperation(operation);
        record.setOperator(operator);
        record.setOperateTime(LocalDateTime.now());
        workRecordRepository.save(record);
    }
    
    public BigDecimal getRevenue(LocalDateTime start, LocalDateTime end) {
        return workOrderRepository.sumTotalAmountByDateRange(start, end);
    }
    
    public Long getOrderCount(LocalDateTime start, LocalDateTime end) {
        return workOrderRepository.countByDateRange(start, end);
    }
}