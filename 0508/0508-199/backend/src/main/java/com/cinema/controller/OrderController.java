package com.cinema.controller;

import com.cinema.entity.Order;
import com.cinema.entity.Schedule;
import com.cinema.service.OrderService;
import com.cinema.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private ScheduleService scheduleService;
    
    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Map<String, Object> request) {
        Long scheduleId = Long.valueOf(request.get("scheduleId").toString());
        @SuppressWarnings("unchecked")
        List<Long> seatIds = (List<Long>) request.get("seatIds");
        String memberPhone = (String) request.get("memberPhone");
        String seatLabels = (String) request.get("seatLabels");
        
        Schedule schedule = scheduleService.getScheduleById(scheduleId);
        if (schedule == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Order order = orderService.createOrder(schedule, seatIds, memberPhone, seatLabels);
        return ResponseEntity.ok(order);
    }
    
    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<Order>> getMemberOrders(@PathVariable Long memberId) {
        return ResponseEntity.ok(orderService.getMemberOrders(memberId));
    }
}