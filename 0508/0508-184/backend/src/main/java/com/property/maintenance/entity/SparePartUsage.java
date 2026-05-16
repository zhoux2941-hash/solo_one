package com.property.maintenance.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "spare_part_usage")
public class SparePartUsage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "repairman_id")
    private Long repairmanId;

    @Column(name = "spare_part_id")
    private Long sparePartId;

    private Integer quantity;

    @Column(name = "used_at")
    private LocalDateTime usedAt;
}
