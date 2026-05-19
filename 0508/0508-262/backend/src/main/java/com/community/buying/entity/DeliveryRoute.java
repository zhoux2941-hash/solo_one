package com.community.buying.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "delivery_route")
public class DeliveryRoute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String routeName;

    @Column(length = 500)
    private String routeDescription;

    @Column(length = 500)
    private String storeIds;

    @ManyToOne
    @JoinColumn(name = "delivery_person_id")
    private User deliveryPerson;

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