package com.smartparking.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "rate_config")
public class RateConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parking_lot_id")
    private Long parkingLotId;

    @Column(name = "rate_type", nullable = false, length = 20)
    private String rateType;

    @Column(name = "start_time", length = 10)
    private String startTime;

    @Column(name = "end_time", length = 10)
    private String endTime;

    @Column(name = "price_per_hour", precision = 10, scale = 2)
    private BigDecimal pricePerHour;

    @Column(name = "max_daily_fee", precision = 10, scale = 2)
    private BigDecimal maxDailyFee;

    @Column(name = "free_minutes")
    private Integer freeMinutes;

    @Column(length = 20)
    private String status;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
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
