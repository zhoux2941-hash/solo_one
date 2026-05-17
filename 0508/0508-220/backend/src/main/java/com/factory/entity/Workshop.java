package com.factory.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "workshop")
public class Workshop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String workshopCode;

    @Column(nullable = false, length = 100)
    private String workshopName;

    @Column(length = 200)
    private String workshopLocation;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String workshopManager;

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