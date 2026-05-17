package com.metro.inspection.controller;

import com.metro.inspection.dto.WorkOrderStatusUpdateDTO;
import com.metro.inspection.entity.WorkOrder;
import com.metro.inspection.service.WorkOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/work-orders")
@CrossOrigin(origins = "*")
public class WorkOrderController {

    @Autowired
    private WorkOrderService workOrderService;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllWorkOrders(
            @RequestParam(required = false) String status) {
        
        List<WorkOrder> orders = workOrderService.getAllWorkOrders(status);
        List<Map<String, Object>> result = orders.stream().map(this::convertToMap).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{orderNo}")
    public ResponseEntity<Map<String, Object>> getWorkOrderByOrderNo(@PathVariable String orderNo) {
        Optional<WorkOrder> optional = workOrderService.getWorkOrderByOrderNo(orderNo);
        if (optional.isPresent()) {
            return ResponseEntity.ok(convertToMap(optional.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{orderNo}/status")
    public ResponseEntity<Map<String, Object>> updateWorkOrderStatus(
            @PathVariable String orderNo,
            @RequestBody WorkOrderStatusUpdateDTO dto) {
        
        WorkOrder updated = workOrderService.updateWorkOrderStatus(orderNo, dto.getStatus());
        if (updated != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "状态更新成功");
            response.put("order", convertToMap(updated));
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.notFound().build();
    }

    private Map<String, Object> convertToMap(WorkOrder order) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", order.getId());
        map.put("orderNo", order.getOrderNo());
        map.put("section", order.getSection());
        map.put("mileage", order.getMileage());
        map.put("damageType", order.getDamageType());
        map.put("severityLevel", order.getSeverityLevel().getDescription());
        map.put("suggestedRepairTime", order.getSuggestedRepairTime());
        map.put("status", order.getStatus().name());
        map.put("createTime", order.getCreateTime().format(DATE_TIME_FORMATTER));
        if (order.getUpdateTime() != null) {
            map.put("updateTime", order.getUpdateTime().format(DATE_TIME_FORMATTER));
        }
        return map;
    }
}
