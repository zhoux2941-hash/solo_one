package com.factory.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "process_route")
public class ProcessRoute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String routeCode;

    @Column(nullable = false, length = 200)
    private String routeName;

    @Column(length = 50)
    private String productType;

    @Column
    private Long materialId;

    @Column(length = 100)
    private String materialName;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalStandardTime;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer status = 1;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @OneToMany(mappedBy = "processRoute", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Process> processes = new ArrayList<>();

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