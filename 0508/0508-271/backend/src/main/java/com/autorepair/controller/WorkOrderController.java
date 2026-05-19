package com.autorepair.controller;

import com.autorepair.common.Result;
import com.autorepair.entity.WorkOrder;
import com.autorepair.entity.WorkOrderPart;
import com.autorepair.entity.WorkRecord;
import com.autorepair.service.WorkOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/workorder")
public class WorkOrderController {
    @Autowired
    private WorkOrderService workOrderService;
    
    @GetMapping("/list")
    public Result<List<WorkOrder>> list() {
        return Result.success(workOrderService.list());
    }
    
    @GetMapping("/status/{status}")
    public Result<List<WorkOrder>> findByStatus(@PathVariable String status) {
        return Result.success(workOrderService.findByStatus(status));
    }
    
    @GetMapping("/customer/{customerId}")
    public Result<List<WorkOrder>> findByCustomerId(@PathVariable Long customerId) {
        return Result.success(workOrderService.findByCustomerId(customerId));
    }
    
    @GetMapping("/search")
    public Result<List<WorkOrder>> search(@RequestParam String keyword) {
        return Result.success(workOrderService.search(keyword));
    }
    
    @GetMapping("/{id}")
    public Result<WorkOrder> getById(@PathVariable Long id) {
        return Result.success(workOrderService.getById(id));
    }
    
    @GetMapping("/{id}/parts")
    public Result<List<WorkOrderPart>> getOrderParts(@PathVariable Long id) {
        return Result.success(workOrderService.getOrderParts(id));
    }
    
    @GetMapping("/{id}/records")
    public Result<List<WorkRecord>> getWorkRecords(@PathVariable Long id) {
        return Result.success(workOrderService.getWorkRecords(id));
    }
    
    @PostMapping("/create")
    public Result<WorkOrder> create(@RequestBody WorkOrder workOrder) {
        return Result.success(workOrderService.create(workOrder));
    }
    
    @PostMapping("/{id}/assign")
    public Result<WorkOrder> assign(@PathVariable Long id, @RequestParam String assignTo) {
        return Result.success(workOrderService.assign(id, assignTo));
    }
    
    @PostMapping("/{id}/start")
    public Result<WorkOrder> startWork(@PathVariable Long id) {
        return Result.success(workOrderService.startWork(id));
    }
    
    @PostMapping("/{id}/complete")
    public Result<WorkOrder> completeWork(@PathVariable Long id) {
        return Result.success(workOrderService.completeWork(id));
    }
    
    @PostMapping("/{id}/settle")
    public Result<WorkOrder> settle(@PathVariable Long id, 
                                    @RequestParam(required = false) BigDecimal discountAmount,
                                    @RequestParam BigDecimal paidAmount) {
        return Result.success(workOrderService.settle(id, discountAmount, paidAmount));
    }
    
    @PostMapping("/part/add")
    public Result<WorkOrderPart> addPart(@RequestBody WorkOrderPart part) {
        return Result.success(workOrderService.addPart(part));
    }
}