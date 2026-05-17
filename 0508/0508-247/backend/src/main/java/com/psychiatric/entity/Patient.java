package com.psychiatric.entity;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "patient")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String braceletId;
    
    private String name;
    
    private String wardNumber;
    
    private String currentLocation;
    
    private Boolean isActive = true;
}
