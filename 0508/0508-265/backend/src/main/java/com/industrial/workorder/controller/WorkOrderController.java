package com.industrial.workorder.controller;

import com.industrial.workorder.entity.ApprovalRecord;
import com.industrial.workorder.entity.WorkOrder;
import com.industrial.workorder.repository.ApprovalRecordRepository;
import com.industrial.workorder.service.WorkOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/workorders")
@CrossOrigin(origins = "*")
public class WorkOrderController {

    @Autowired
    private WorkOrderService workOrderService;

    @Autowired
    private ApprovalRecordRepository approvalRecordRepository;

    @GetMapping
    public List<WorkOrder> findAll() {
        return workOrderService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrder> findById(@PathVariable Long id) {
        Optional<WorkOrder> order = workOrderService.findById(id);
        return order.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<WorkOrder> findByStatus(@PathVariable String status) {
        return workOrderService.findByStatus(status);
    }

    @GetMapping("/creator/{creatorId}")
    public List<WorkOrder> findByCreatorId(@PathVariable Long creatorId) {
        return workOrderService.findByCreatorId(creatorId);
    }

    @GetMapping("/assignee/{assigneeId}")
    public List<WorkOrder> findByAssigneeId(@PathVariable Long assigneeId) {
        return workOrderService.findByAssigneeId(assigneeId);
    }

    @GetMapping("/teamleader/{teamLeaderId}/pending")
    public List<WorkOrder> findPendingTeamLeaderApprovals(@PathVariable Long teamLeaderId) {
        return workOrderService.findPendingTeamLeaderApprovals(teamLeaderId);
    }

    @GetMapping("/admin/{adminId}/pending")
    public List<WorkOrder> findPendingAdminApprovals(@PathVariable Long adminId) {
        return workOrderService.findPendingAdminApprovals(adminId);
    }

    @GetMapping("/{id}/approvals")
    public List<ApprovalRecord> findApprovalRecords(@PathVariable Long id) {
        return approvalRecordRepository.findByWorkOrderIdOrderByApprovalTimeDesc(id);
    }

    @PostMapping
    public WorkOrder create(@RequestBody WorkOrder workOrder) {
        return workOrderService.createWorkOrder(workOrder);
    }

    @PostMapping("/from-alert/{alertId}")
    public ResponseEntity<WorkOrder> createFromAlert(@PathVariable Long alertId) {
        WorkOrder order = workOrderService.createWorkOrderFromAlert(alertId);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/approve/teamleader")
    public ResponseEntity<WorkOrder> approveByTeamLeader(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        Long approverId = Long.valueOf(data.get("approverId").toString());
        String comment = data.get("comment") != null ? data.get("comment").toString() : "";
        boolean approved = Boolean.parseBoolean(data.get("approved").toString());
        
        WorkOrder order = workOrderService.approveByTeamLeader(id, approverId, comment, approved);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/approve/admin")
    public ResponseEntity<WorkOrder> approveByAdmin(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        Long approverId = Long.valueOf(data.get("approverId").toString());
        String comment = data.get("comment") != null ? data.get("comment").toString() : "";
        boolean approved = Boolean.parseBoolean(data.get("approved").toString());
        
        WorkOrder order = workOrderService.approveByAdmin(id, approverId, comment, approved);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<WorkOrder> assign(
            @PathVariable Long id,
            @RequestBody Map<String, Long> data) {
        Long assigneeId = data.get("assigneeId");
        WorkOrder order = workOrderService.assignWorkOrder(id, assigneeId);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/claim")
    public ResponseEntity<WorkOrder> claim(
            @PathVariable Long id,
            @RequestBody Map<String, Long> data) {
        Long assigneeId = data.get("assigneeId");
        WorkOrder order = workOrderService.claimWorkOrder(id, assigneeId);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<WorkOrder> complete(@PathVariable Long id) {
        WorkOrder order = workOrderService.completeWorkOrder(id);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }
}
