package com.psychiatric.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "unlock_record")
public class UnlockRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String wardNumber;
    
    private String operator;
    
    private String reason;
    
    private LocalDateTime unlockTime;
    
    private LocalDateTime lockTime;
}
