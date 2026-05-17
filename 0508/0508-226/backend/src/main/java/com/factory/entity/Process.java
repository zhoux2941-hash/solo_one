package com.factory.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "process")
public class Process {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String processCode;

    @Column(nullable = false, length = 100)
    private String processName;

    @Column(nullable = false)
    private Integer sequence;

    @Column(precision = 10, scale = 2)
    private BigDecimal standardTime;

    @Column(length = 100)
    private String equipment;

    @Column(length = 500)
    private String operationGuide;

    @Column
    private Long teamId;

    @Column(length = 100)
    private String teamName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer status = 1;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private ProcessRoute processRoute;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}