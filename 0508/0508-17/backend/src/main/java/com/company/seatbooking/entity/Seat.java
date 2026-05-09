package com.company.seatbooking.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "seat")
public class Seat {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seat_id")
    private Long seatId;
    
    @Column(name = "area", nullable = false, length = 50)
    private String area;
    
    @Column(name = "has_monitor", nullable = false)
    private Boolean hasMonitor = false;
    
    @Column(name = "row_num")
    private Integer rowNum;
    
    @Column(name = "col_num")
    private Integer colNum;
    
    @Column(name = "description", length = 200)
    private String description;
}
