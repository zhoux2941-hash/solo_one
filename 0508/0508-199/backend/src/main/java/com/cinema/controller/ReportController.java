package com.cinema.controller;

import com.cinema.service.ExchangeService;
import com.cinema.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private ExchangeService exchangeService;
    
    @GetMapping("/occupancy")
    public ResponseEntity<List<Object[]>> getOccupancyReport() {
        return ResponseEntity.ok(orderService.getOccupancyReport());
    }
    
    @GetMapping("/snack-ranking")
    public ResponseEntity<List<Object[]>> getSnackRanking() {
        return ResponseEntity.ok(exchangeService.getSnackRanking());
    }
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllReports() {
        Map<String, Object> reports = new HashMap<>();
        reports.put("occupancy", orderService.getOccupancyReport());
        reports.put("snackRanking", exchangeService.getSnackRanking());
        return ResponseEntity.ok(reports);
    }
}