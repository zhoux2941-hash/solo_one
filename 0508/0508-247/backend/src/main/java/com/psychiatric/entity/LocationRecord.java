package com.psychiatric.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "location_record")
public class LocationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String braceletId;
    
    private String patientName;
    
    private String location;
    
    private LocalDateTime recordTime;
    
    private Boolean isNightTime;
}
