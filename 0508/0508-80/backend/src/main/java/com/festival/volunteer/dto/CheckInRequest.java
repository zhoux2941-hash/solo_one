package com.festival.volunteer.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckInRequest {
    @NotNull
    private Long scheduleId;
    
    private String checkInCode;
    private Double latitude;
    private Double longitude;
}
