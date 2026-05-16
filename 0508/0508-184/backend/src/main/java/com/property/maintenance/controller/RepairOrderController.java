package com.property.maintenance.controller;

import com.property.maintenance.entity.RepairOrder;
import com.property.maintenance.exception.BusinessException;
import com.property.maintenance.service.RepairOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class RepairOrderController {

    @Autowired
    private RepairOrderService repairOrderService;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody RepairOrder order,
                                         @RequestHeader(value = "X-Request-Id", required = false) String requestId) {
        try {
            RepairOrder created = repairOrderService.createOrder(order, requestId);
            return ResponseEntity.ok(created);
        } catch (BusinessException e) {
            return ResponseEntity.ok().body(Map.of(
                "code", e.getCode(),
                "message", e.getMessage(),
                "success", false
            ));
        }
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<RepairOrder> assignOrder(@PathVariable Long id, @RequestParam Long repairmanId) {
        RepairOrder order = repairOrderService.assignOrder(id, repairmanId);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    @PutMapping("/{id}/pickup")
    public ResponseEntity<?> pickupSparePart(@PathVariable Long id, @RequestParam Long repairmanId) {
        try {
            boolean success = repairOrderService.pickupSparePart(id, repairmanId);
            if (!success) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok().build();
        } catch (BusinessException e) {
            return ResponseEntity.ok().body(Map.of(
                "code", e.getCode(),
                "message", e.getMessage(),
                "success", false
            ));
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeOrder(@PathVariable Long id) {
        try {
            RepairOrder order = repairOrderService.completeOrder(id);
            if (order == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(order);
        } catch (BusinessException e) {
            return ResponseEntity.ok().body(Map.of(
                "code", e.getCode(),
                "message", e.getMessage(),
                "success", false
            ));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            RepairOrder order = repairOrderService.cancelOrder(id);
            if (order == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(order);
        } catch (BusinessException e) {
            return ResponseEntity.ok().body(Map.of(
                "code", e.getCode(),
                "message", e.getMessage(),
                "success", false
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<RepairOrder>> getAllOrders() {
        return ResponseEntity.ok(repairOrderService.getAllOrders());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<RepairOrder>> getOrdersByStatus(@PathVariable String status) {
        return ResponseEntity.ok(repairOrderService.getOrdersByStatus(status));
    }

    @GetMapping("/repairman/{repairmanId}")
    public ResponseEntity<List<RepairOrder>> getOrdersByRepairman(@PathVariable Long repairmanId) {
        return ResponseEntity.ok(repairOrderService.getOrdersByRepairman(repairmanId));
    }
}
