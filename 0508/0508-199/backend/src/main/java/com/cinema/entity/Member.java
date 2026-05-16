package com.cinema.entity;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "members")
public class Member {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String phone;
    
    private Integer points;
    
    @Version
    private Integer version;
    
    private java.time.LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        if (points == null) points = 0;
    }
}