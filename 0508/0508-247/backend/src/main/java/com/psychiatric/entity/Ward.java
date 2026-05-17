package com.psychiatric.entity;

import lombok.Data;
import javax.persistence.*;
import java.util.List;

@Data
@Entity
@Table(name = "ward")
public class Ward {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String wardNumber;
    
    private Boolean doorLocked = true;
    
    @ElementCollection
    private List<String> authorizedPersonnel;
    
    private String currentUnlocker;
    
    private String unlockReason;
}
