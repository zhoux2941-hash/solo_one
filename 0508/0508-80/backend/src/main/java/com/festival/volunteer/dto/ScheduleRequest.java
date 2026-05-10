package com.festival.volunteer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScheduleRequest {
    @NotNull
    private Long volunteerId;
    
    @NotNull
    private Long positionId;
    
    private Long applicationId;
    
    @NotBlank
    private String scheduleDate;
    
    @NotBlank
    private String startTime;
    
    @NotBlank
    private String endTime;
    
    @NotBlank
    private String location;
    
    private String notes;
}
