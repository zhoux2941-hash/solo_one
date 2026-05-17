package com.metro.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "tunnel_section")
public class TunnelSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String sectionId;

    @Column(nullable = false)
    private String sectionName;

    private String description;

    private Boolean ventilationActive = false;

    private LocalDateTime ventilationStartTime;

    private Long totalVentilationDuration = 0L;

    private LocalDateTime createTime = LocalDateTime.now();
}
