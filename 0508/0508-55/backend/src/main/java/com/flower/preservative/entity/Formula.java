package com.flower.preservative.entity;

import lombok.Data;
import javax.persistence.*;

@Entity
@Table(name = "formulas")
@Data
public class Formula {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "formula_code", unique = true, nullable = false)
    private String formulaCode;
    
    @Column(name = "formula_name")
    private String formulaName;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "fresh_days")
    private Integer freshDays;
    
    @Column(name = "cost")
    private Integer cost;
    
    @Column(name = "ease_of_use")
    private Integer easeOfUse;
}
