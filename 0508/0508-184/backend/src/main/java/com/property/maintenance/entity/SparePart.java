package com.property.maintenance.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "spare_part")
public class SparePart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code;

    private String specification;

    private String unit;

    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    @Column(name = "locked_quantity")
    private Integer lockedQuantity;

    @Column(name = "min_stock")
    private Integer minStock;

    @Version
    private Integer version;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
