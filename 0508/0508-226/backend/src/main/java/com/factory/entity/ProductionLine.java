package com.factory.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "production_line")
public class ProductionLine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String lineCode;

    @Column(nullable = false, length = 100)
    private String lineName;

    @Column(nullable = false)
    private Long workshopId;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String lineLeader;

    @Column(nullable = false)
    private Integer status = 1;

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