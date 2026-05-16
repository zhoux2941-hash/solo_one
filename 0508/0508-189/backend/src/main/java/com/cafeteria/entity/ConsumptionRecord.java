package com.cafeteria.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consumption_records")
public class ConsumptionRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String employeeId;
    
    @Column(nullable = false)
    private Double amount;
    
    @Column(nullable = false)
    private LocalDateTime consumptionTime;
    
    @Column(nullable = false)
    private String windowNumber;

    public ConsumptionRecord() {}

    public ConsumptionRecord(String employeeId, Double amount, LocalDateTime consumptionTime, String windowNumber) {
        this.employeeId = employeeId;
        this.amount = amount;
        this.consumptionTime = consumptionTime;
        this.windowNumber = windowNumber;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public LocalDateTime getConsumptionTime() {
        return consumptionTime;
    }

    public void setConsumptionTime(LocalDateTime consumptionTime) {
        this.consumptionTime = consumptionTime;
    }

    public String getWindowNumber() {
        return windowNumber;
    }

    public void setWindowNumber(String windowNumber) {
        this.windowNumber = windowNumber;
    }
}
