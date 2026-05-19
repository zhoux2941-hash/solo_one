package com.autorepair.controller;

import com.autorepair.common.Result;
import com.autorepair.service.WorkOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {
    @Autowired
    private WorkOrderService workOrderService;
    
    @GetMapping("/monthly")
    public Result<Map<String, Object>> getMonthlyStatistics() {
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime start = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime end = currentMonth.atEndOfMonth().atTime(23, 59, 59);
        
        BigDecimal revenue = workOrderService.getRevenue(start, end);
        Long orderCount = workOrderService.getOrderCount(start, end);
        
        Map<String, Object> result = new HashMap<>();
        result.put("month", currentMonth.toString());
        result.put("revenue", revenue != null ? revenue : BigDecimal.ZERO);
        result.put("orderCount", orderCount != null ? orderCount : 0);
        
        return Result.success(result);
    }
    
    @GetMapping("/dashboard")
    public Result<Map<String, Object>> getDashboard() {
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime start = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime end = currentMonth.atEndOfMonth().atTime(23, 59, 59);
        
        BigDecimal revenue = workOrderService.getRevenue(start, end);
        Long orderCount = workOrderService.getOrderCount(start, end);
        
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime todayEnd = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        BigDecimal todayRevenue = workOrderService.getRevenue(todayStart, todayEnd);
        Long todayOrderCount = workOrderService.getOrderCount(todayStart, todayEnd);
        
        Map<String, Object> result = new HashMap<>();
        result.put("monthRevenue", revenue != null ? revenue : BigDecimal.ZERO);
        result.put("monthOrderCount", orderCount != null ? orderCount : 0);
        result.put("todayRevenue", todayRevenue != null ? todayRevenue : BigDecimal.ZERO);
        result.put("todayOrderCount", todayOrderCount != null ? todayOrderCount : 0);
        
        return Result.success(result);
    }
}