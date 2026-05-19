package com.industrial.workorder.service;

import com.industrial.workorder.dto.NotificationMessage;
import com.industrial.workorder.entity.*;
import com.industrial.workorder.exception.ConcurrentOperationException;
import com.industrial.workorder.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class WorkOrderService {

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApprovalRecordRepository approvalRecordRepository;

    @Autowired
    private AlertMessageRepository alertMessageRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public List<WorkOrder> findAll() {
        List<WorkOrder> orders = workOrderRepository.findAll();
        orders.forEach(this::populateTransientFields);
        return orders;
    }

    public Optional<WorkOrder> findById(Long id) {
        Optional<WorkOrder> orderOpt = workOrderRepository.findById(id);
        orderOpt.ifPresent(this::populateTransientFields);
        return orderOpt;
    }

    public List<WorkOrder> findByStatus(String status) {
        List<WorkOrder> orders = workOrderRepository.findByStatus(status);
        orders.forEach(this::populateTransientFields);
        return orders;
    }

    public List<WorkOrder> findByCreatorId(Long creatorId) {
        List<WorkOrder> orders = workOrderRepository.findByCreatorId(creatorId);
        orders.forEach(this::populateTransientFields);
        return orders;
    }

    public List<WorkOrder> findByAssigneeId(Long assigneeId) {
        List<WorkOrder> orders = workOrderRepository.findByAssigneeId(assigneeId);
        orders.forEach(this::populateTransientFields);
        return orders;
    }

    public List<WorkOrder> findPendingTeamLeaderApprovals(Long teamLeaderId) {
        List<WorkOrder> orders = workOrderRepository.findPendingTeamLeaderApprovals(teamLeaderId);
        orders.forEach(this::populateTransientFields);
        return orders;
    }

    public List<WorkOrder> findPendingAdminApprovals(Long adminId) {
        List<WorkOrder> orders = workOrderRepository.findPendingAdminApprovals(adminId);
        orders.forEach(this::populateTransientFields);
        return orders;
    }

    @Transactional
    public WorkOrder createWorkOrder(WorkOrder workOrder) {
        workOrder.setOrderNo(generateOrderNo());
        workOrder.setStatus("PENDING");
        workOrder.setCurrentApprovalLevel(0);
        workOrder.setTeamLeaderStatus("PENDING");
        workOrder.setAdminStatus("PENDING");
        
        List<User> teamLeaders = userRepository.findByRole("TEAM_LEADER");
        List<User> admins = userRepository.findByRole("ADMIN");
        
        if (!teamLeaders.isEmpty()) {
            workOrder.setTeamLeaderId(teamLeaders.get(0).getId());
        }
        if (!admins.isEmpty()) {
            workOrder.setAdminId(admins.get(0).getId());
        }

        WorkOrder saved = workOrderRepository.save(workOrder);
        populateTransientFields(saved);
        return saved;
    }

    @Transactional
    public WorkOrder createWorkOrderFromAlert(Long alertId) {
        Optional<AlertMessage> alertOpt = alertMessageRepository.findById(alertId);
        if (!alertOpt.isPresent()) {
            return null;
        }
        
        AlertMessage alert = alertOpt.get();
        Optional<Device> deviceOpt = deviceRepository.findById(alert.getDeviceId());
        if (!deviceOpt.isPresent()) {
            return null;
        }

        WorkOrder workOrder = new WorkOrder();
        workOrder.setOrderNo(generateOrderNo());
        workOrder.setDeviceId(alert.getDeviceId());
        workOrder.setTitle("设备异常告警：" + alert.getTitle());
        workOrder.setDescription(alert.getContent());
        workOrder.setFaultType("AUTO_ALERT");
        workOrder.setPriority("HIGH");
        workOrder.setStatus("PENDING");
        workOrder.setCurrentApprovalLevel(0);
        workOrder.setTeamLeaderStatus("PENDING");
        workOrder.setAdminStatus("PENDING");

        List<User> teamLeaders = userRepository.findByRole("TEAM_LEADER");
        List<User> admins = userRepository.findByRole("ADMIN");
        
        if (!teamLeaders.isEmpty()) {
            workOrder.setTeamLeaderId(teamLeaders.get(0).getId());
        }
        if (!admins.isEmpty()) {
            workOrder.setAdminId(admins.get(0).getId());
        }

        WorkOrder saved = workOrderRepository.save(workOrder);
        alert.setWorkOrderId(saved.getId());
        alertMessageRepository.save(alert);
        
        populateTransientFields(saved);
        return saved;
    }

    @Transactional
    public WorkOrder approveByTeamLeader(Long orderId, Long approverId, String comment, boolean approved) {
        Optional<WorkOrder> orderOpt = workOrderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return null;
        }

        WorkOrder order = orderOpt.get();
        
        if (!"PENDING".equals(order.getStatus())) {
            throw new ConcurrentOperationException("该工单当前状态为 [" + order.getStatus() + "]，不允许组长审批");
        }
        
        if (order.getTeamLeaderStatus() != null && !"PENDING".equals(order.getTeamLeaderStatus())) {
            throw new ConcurrentOperationException("该工单已被其他组长审批，当前状态：" + order.getTeamLeaderStatus());
        }

        order.setTeamLeaderStatus(approved ? "APPROVED" : "REJECTED");
        
        if (approved) {
            order.setCurrentApprovalLevel(1);
            order.setStatus("LEADER_APPROVED");
        } else {
            order.setStatus("REJECTED");
        }

        ApprovalRecord record = new ApprovalRecord();
        record.setWorkOrderId(orderId);
        record.setApprovalLevel(1);
        record.setApproverId(approverId);
        record.setApprovalResult(approved ? "APPROVED" : "REJECTED");
        record.setComment(comment);
        approvalRecordRepository.save(record);

        WorkOrder saved = workOrderRepository.save(order);
        populateTransientFields(saved);
        
        sendNotification("workorder", "工单" + (approved ? "审批通过" : "被驳回") + ": " + saved.getTitle());
        
        return saved;
    }

    @Transactional
    public WorkOrder approveByAdmin(Long orderId, Long approverId, String comment, boolean approved) {
        Optional<WorkOrder> orderOpt = workOrderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return null;
        }

        WorkOrder order = orderOpt.get();
        
        if (!"LEADER_APPROVED".equals(order.getStatus())) {
            throw new ConcurrentOperationException("该工单当前状态为 [" + order.getStatus() + "]，需先通过组长审批");
        }
        
        if (order.getAdminStatus() != null && !"PENDING".equals(order.getAdminStatus())) {
            throw new ConcurrentOperationException("该工单已被其他管理员审批，当前状态：" + order.getAdminStatus());
        }

        order.setAdminStatus(approved ? "APPROVED" : "REJECTED");
        
        if (approved) {
            order.setCurrentApprovalLevel(2);
            order.setStatus("ADMIN_APPROVED");
        } else {
            order.setStatus("REJECTED");
        }

        ApprovalRecord record = new ApprovalRecord();
        record.setWorkOrderId(orderId);
        record.setApprovalLevel(2);
        record.setApproverId(approverId);
        record.setApprovalResult(approved ? "APPROVED" : "REJECTED");
        record.setComment(comment);
        approvalRecordRepository.save(record);

        WorkOrder saved = workOrderRepository.save(order);
        populateTransientFields(saved);
        
        sendNotification("workorder", "工单" + (approved ? "审批通过" : "被驳回") + ": " + saved.getTitle());
        
        return saved;
    }

    @Transactional
    public WorkOrder assignWorkOrder(Long orderId, Long assigneeId) {
        Optional<WorkOrder> orderOpt = workOrderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return null;
        }

        WorkOrder order = orderOpt.get();
        
        if (!"ADMIN_APPROVED".equals(order.getStatus())) {
            throw new ConcurrentOperationException("该工单当前状态为 [" + order.getStatus() + "]，需先完成两级审批");
        }
        
        if (order.getAssigneeId() != null) {
            throw new ConcurrentOperationException("该工单已分配给其他运维人员");
        }

        order.setAssigneeId(assigneeId);
        order.setStatus("ASSIGNED");

        WorkOrder saved = workOrderRepository.save(order);
        populateTransientFields(saved);
        
        sendNotification("workorder", "工单已分配: " + saved.getTitle());
        
        return saved;
    }

    @Transactional
    public WorkOrder claimWorkOrder(Long orderId, Long assigneeId) {
        Optional<WorkOrder> orderOpt = workOrderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return null;
        }

        WorkOrder order = orderOpt.get();
        
        if (!"ADMIN_APPROVED".equals(order.getStatus()) && !"ASSIGNED".equals(order.getStatus())) {
            throw new ConcurrentOperationException("该工单当前状态为 [" + order.getStatus() + "]，不允许认领");
        }
        
        if (order.getAssigneeId() != null && !order.getAssigneeId().equals(assigneeId)) {
            throw new ConcurrentOperationException("该工单已分配给其他运维人员");
        }
        
        if ("IN_PROGRESS".equals(order.getStatus()) || "COMPLETED".equals(order.getStatus())) {
            throw new ConcurrentOperationException("该工单已被认领或已完成");
        }

        order.setAssigneeId(assigneeId);
        order.setStatus("IN_PROGRESS");

        WorkOrder saved = workOrderRepository.save(order);
        populateTransientFields(saved);
        
        sendNotification("workorder", "工单已认领: " + saved.getTitle());
        
        return saved;
    }

    @Transactional
    public WorkOrder completeWorkOrder(Long orderId) {
        Optional<WorkOrder> orderOpt = workOrderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return null;
        }

        WorkOrder order = orderOpt.get();
        
        if (!"IN_PROGRESS".equals(order.getStatus())) {
            throw new ConcurrentOperationException("该工单当前状态为 [" + order.getStatus() + "]，只有进行中的工单可以完成");
        }
        
        if ("COMPLETED".equals(order.getStatus())) {
            throw new ConcurrentOperationException("该工单已完成");
        }

        order.setStatus("COMPLETED");
        order.setActualCompleteTime(LocalDateTime.now());

        WorkOrder saved = workOrderRepository.save(order);
        populateTransientFields(saved);
        
        sendNotification("workorder", "工单已完成: " + saved.getTitle());
        
        return saved;
    }

    private String generateOrderNo() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int random = new Random().nextInt(1000);
        return "WO" + timestamp + String.format("%03d", random);
    }

    private void populateTransientFields(WorkOrder order) {
        deviceRepository.findById(order.getDeviceId()).ifPresent(d -> {
            order.setDeviceName(d.getDeviceName());
            order.setDeviceCode(d.getDeviceCode());
        });
        if (order.getCreatorId() != null) {
            userRepository.findById(order.getCreatorId()).ifPresent(u -> order.setCreatorName(u.getRealName()));
        }
        if (order.getAssigneeId() != null) {
            userRepository.findById(order.getAssigneeId()).ifPresent(u -> order.setAssigneeName(u.getRealName()));
        }
    }

    private void sendNotification(String type, String message) {
        try {
            messagingTemplate.convertAndSend("/topic/notifications", 
                new NotificationMessage(type, message, LocalDateTime.now()));
        } catch (Exception e) {
        }
    }

}
