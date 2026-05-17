package com.psychiatric.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alert")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String braceletId;
    
    private String patientName;
    
    private String alertType;
    
    private String message;
    
    private LocalDateTime alertTime;
    
    private Boolean isRead = false;
}
