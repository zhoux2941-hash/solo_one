package com.office.platform.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sys_supply_record")
public class SupplyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supply_id", nullable = false)
    private Supply supply;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 500)
    private String remark;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "operator_id", nullable = false)
    private User operator;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
}
