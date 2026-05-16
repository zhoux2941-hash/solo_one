package com.sales.controller;

import com.sales.dto.DashboardStats;
import com.sales.entity.Customer;
import com.sales.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/stats")
    public DashboardStats getDashboardStats() {
        return dashboardService.getDashboardStats();
    }

    @GetMapping("/customers")
    public List<Customer> getAllCustomersWithProbability() {
        return dashboardService.getAllCustomersWithProbability();
    }
}