package com.community.station.entity;

import lombok.Data;
import javax.persistence.*;
import javax.validation.constraints.Pattern;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "stations")
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String stationName;

    @Column(nullable = false)
    private String address;

    private String serviceScope;

    private String businessHours;

    private String governingCommunity;

    @Pattern(regexp = "^(1[3-9]\\d{9}|0\\d{2,3}-?\\d{7,8})$", message = "电话格式不正确，请输入手机号或固定电话")
    private String contactPhone;

    private String manager;

    private String description;

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
