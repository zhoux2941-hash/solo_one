package com.buscompany.fatigue.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "drivers")
public class Driver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String driverNo;

    @Column(nullable = false)
    private String name;

    private String phone;

    private String busNo;

    private String route;

    private Boolean online = false;

    private LocalDateTime lastOnlineTime;

    private LocalDateTime createTime = LocalDateTime.now();
}
