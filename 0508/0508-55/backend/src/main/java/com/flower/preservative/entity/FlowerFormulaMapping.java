package com.flower.preservative.entity;

import lombok.Data;
import javax.persistence.*;

@Entity
@Table(name = "flower_formula_mappings")
@Data
public class FlowerFormulaMapping {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "flower_type", nullable = false)
    private String flowerType;
    
    @Column(name = "formula_code", nullable = false)
    private String formulaCode;
    
    @Column(name = "lifespan_extension_days")
    private Integer lifespanExtensionDays;
    
    @Column(name = "is_recommended")
    private Boolean isRecommended;
}
