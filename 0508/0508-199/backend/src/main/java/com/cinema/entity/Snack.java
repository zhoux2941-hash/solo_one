package com.cinema.entity;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "snacks")
public class Snack {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String icon;
    
    @Column(nullable = false)
    private Integer points;
}