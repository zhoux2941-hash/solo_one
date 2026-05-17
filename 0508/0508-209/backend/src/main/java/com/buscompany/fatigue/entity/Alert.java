package com.buscompany.fatigue.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alerts")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String driverNo;

    private String driverName;

    private String busNo;

    private String alertType;

    private String alertLevel;

    private String message;

    private Integer count;

    private Boolean handled = false;

    private String handledBy;

    private LocalDateTime handleTime;

    private LocalDateTime alertTime = LocalDateTime.now();
}
