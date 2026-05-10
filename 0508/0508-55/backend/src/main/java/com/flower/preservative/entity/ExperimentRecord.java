package com.flower.preservative.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "experiment_records")
@Data
public class ExperimentRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "session_id")
    private String sessionId;
    
    @Column(name = "flower_type", nullable = false)
    private String flowerType;
    
    @Column(name = "experiment_days", nullable = false)
    private Integer experimentDays;
    
    @Column(name = "formula_a_result")
    private Double formulaAResult;
    
    @Column(name = "formula_a_status")
    private String formulaAStatus;
    
    @Column(name = "formula_b_result")
    private Double formulaBResult;
    
    @Column(name = "formula_b_status")
    private String formulaBStatus;
    
    @Column(name = "formula_c_result")
    private Double formulaCResult;
    
    @Column(name = "formula_c_status")
    private String formulaCStatus;
    
    @Column(name = "formula_d_result")
    private Double formulaDResult;
    
    @Column(name = "formula_d_status")
    private String formulaDStatus;
    
    @Column(name = "formula_d_exists")
    private Boolean formulaDExists = false;
    
    @Column(name = "formula_d_name")
    private String formulaDName;
    
    @Column(name = "recommended_formula")
    private String recommendedFormula;
    
    @Column(name = "is_logged_in")
    private Boolean isLoggedIn = false;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Column(name = "note")
    private String note;
}
