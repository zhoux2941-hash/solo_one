package com.example.chemical.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "chemicals")
public class Chemical {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String casNumber;

    @Column(nullable = false)
    private BigDecimal currentStock;

    @Column(nullable = false)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DangerLevel dangerLevel;

    @Version
    private Integer version;

    public enum DangerLevel {
        HIGH,
        MEDIUM,
        LOW
    }
}
