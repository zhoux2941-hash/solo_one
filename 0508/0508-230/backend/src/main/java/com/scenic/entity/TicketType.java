package com.scenic.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "ticket_type")
public class TicketType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String typeCode;

    @Column(nullable = false, length = 100)
    private String typeName;

    @Column(nullable = false, length = 50)
    private String ticketCategory;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 10, scale = 2)
    private BigDecimal originalPrice;

    private Integer validDays;

    private LocalDateTime validStartTime;

    private LocalDateTime validEndTime;

    private Integer maxPurchasePerPerson;

    private Integer totalInventory;

    private Integer soldCount = 0;

    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String useRules;

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "ticket_type_resource",
        joinColumns = @JoinColumn(name = "ticket_type_id"),
        inverseJoinColumns = @JoinColumn(name = "resource_id")
    )
    private List<BusinessResource> availableResources;

    @Column(length = 20)
    private String status = "启用";

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
