package com.community.buying.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "store")
public class Store {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String storeName;

    @Column(length = 200)
    private String address;

    @Column(length = 20)
    private String contactPhone;

    @Column(length = 50)
    private String contactName;

    @Column(length = 200)
    private String businessHours;

    @Column(length = 200)
    private String storeImage;

    private Double latitude;

    private Double longitude;

    @ManyToOne
    @JoinColumn(name = "leader_id")
    private User leader;

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