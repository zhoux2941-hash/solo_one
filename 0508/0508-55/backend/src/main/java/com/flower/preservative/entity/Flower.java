package com.flower.preservative.entity;

import lombok.Data;
import javax.persistence.*;

@Entity
@Table(name = "flowers")
@Data
public class Flower {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "flower_type", unique = true, nullable = false)
    private String flowerType;
    
    @Column(name = "recommended_formula")
    private String recommendedFormula;
    
    @Column(name = "base_lifespan_days")
    private Integer baseLifespanDays;
}
