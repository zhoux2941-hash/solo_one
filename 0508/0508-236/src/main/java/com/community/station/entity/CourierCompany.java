package com.community.station.entity;

import lombok.Data;
import javax.persistence.*;
import javax.validation.constraints.Pattern;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "courier_companies")
public class CourierCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String companyName;

    @Column(unique = true, nullable = false)
    private String companyCode;

    private String contactPerson;

    @Pattern(regexp = "^(1[3-9]\\d{9}|0\\d{2,3}-?\\d{7,8})$", message = "电话格式不正确，请输入手机号或固定电话")
    private String contactPhone;

    private String apiUrl;

    private String apiKey;

    private String apiSecret;

    @Column(length = 2000)
    private String deliveryRules;

    private String serviceArea;

    private String settlementMethod;

    private Boolean enabled = true;

    private String remark;

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
