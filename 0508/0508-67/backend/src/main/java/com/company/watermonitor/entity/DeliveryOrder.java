package com.company.watermonitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Entity
@Table(name = "delivery_orders")
public class DeliveryOrder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;
    
    @Column(name = "machine_id")
    private Long machineId;
    
    @Column(name = "floor", nullable = false)
    private Integer floor;
    
    @Column(name = "machine_ids_json", length = 2000)
    private String machineIdsJson;
    
    @Column(name = "remaining_liters_json", length = 2000)
    private String remainingLitersJson;
    
    @Column(name = "order_time", nullable = false)
    private LocalDateTime orderTime;
    
    @Column(name = "delivered_time")
    private LocalDateTime deliveredTime;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status;
    
    @Column(name = "remaining_liters")
    private Double remainingLiters;
    
    @Column(name = "machine_count", nullable = false)
    private Integer machineCount = 1;
    
    @PrePersist
    protected void onCreate() {
        if (orderTime == null) {
            orderTime = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDING";
        }
    }
    
    public List<Long> getMachineIds() {
        if (machineIdsJson == null || machineIdsJson.isEmpty()) {
            if (machineId != null) {
                return List.of(machineId);
            }
            return new ArrayList<>();
        }
        String[] parts = machineIdsJson.split(",");
        List<Long> ids = new ArrayList<>();
        for (String part : parts) {
            if (!part.trim().isEmpty()) {
                ids.add(Long.parseLong(part.trim()));
            }
        }
        return ids;
    }
    
    public void setMachineIds(List<Long> machineIds) {
        if (machineIds == null || machineIds.isEmpty()) {
            this.machineIdsJson = null;
            this.machineCount = 0;
        } else {
            this.machineIdsJson = machineIds.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
            this.machineCount = machineIds.size();
        }
    }
    
    public List<Double> getRemainingLitersList() {
        if (remainingLitersJson == null || remainingLitersJson.isEmpty()) {
            if (remainingLiters != null) {
                return List.of(remainingLiters);
            }
            return new ArrayList<>();
        }
        String[] parts = remainingLitersJson.split(",");
        List<Double> liters = new ArrayList<>();
        for (String part : parts) {
            if (!part.trim().isEmpty()) {
                liters.add(Double.parseDouble(part.trim()));
            }
        }
        return liters;
    }
    
    public void setRemainingLitersList(List<Double> remainingLitersList) {
        if (remainingLitersList == null || remainingLitersList.isEmpty()) {
            this.remainingLitersJson = null;
        } else {
            this.remainingLitersJson = remainingLitersList.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
        }
    }
    
    public Double getMinRemainingLiters() {
        List<Double> liters = getRemainingLitersList();
        if (liters.isEmpty()) {
            return remainingLiters;
        }
        return liters.stream().min(Double::compareTo).orElse(0.0);
    }
}
