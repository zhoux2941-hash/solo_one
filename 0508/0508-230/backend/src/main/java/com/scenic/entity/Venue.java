package com.scenic.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "venue")
public class Venue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String venueCode;

    @Column(nullable = false, length = 200)
    private String venueName;

    @Column(length = 100)
    private String venueType;

    @Column(length = 500)
    private String description;

    @Column(length = 200)
    private String location;

    private Integer capacity;

    @Column(precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(precision = 10, scale = 2)
    private BigDecimal dailyRate;

    @Column(length = 500)
    private String facilities;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(length = 20)
    private String status = "开放";

    @Column(length = 500)
    private String remark;

    @Column(updatable = false)
    private LocalDateTime createTime;

    private LocalDateTime updateTime;

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
