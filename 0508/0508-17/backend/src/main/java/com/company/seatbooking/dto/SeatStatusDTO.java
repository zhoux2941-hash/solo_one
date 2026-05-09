package com.company.seatbooking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeatStatusDTO {
    private Long seatId;
    private String area;
    private Boolean hasMonitor;
    private Integer rowNum;
    private Integer colNum;
    private String description;
    private String morningStatus;
    private String afternoonStatus;
}
