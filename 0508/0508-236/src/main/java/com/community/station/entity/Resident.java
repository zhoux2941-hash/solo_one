package com.community.station.entity;

import lombok.Data;
import javax.persistence.*;
import javax.validation.constraints.Pattern;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "residents")
public class Resident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String realName;

    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确，请输入11位有效手机号")
    @Column(length = 11)
    private String phone;

    private String backupPhone;

    private String buildingNumber;

    private String roomNumber;

    private String fullAddress;

    private String pickupMethod;

    private String pickupAddress;

    private String deliveryNotes;

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
