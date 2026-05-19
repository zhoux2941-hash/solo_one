package com.autorepair.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "vehicle")
public class Vehicle extends BaseEntity {
    private Long customerId;
    private String customerName;
    private String plateNumber;
    private String vin;
    private String brand;
    private String model;
    private String color;
    private BigDecimal mileage;
    private LocalDate registerDate;
    private String engineNumber;
    private String remark;
}