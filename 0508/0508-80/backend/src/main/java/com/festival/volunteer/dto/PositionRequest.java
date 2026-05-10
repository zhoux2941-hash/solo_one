package com.festival.volunteer.dto;

import com.festival.volunteer.entity.Position;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PositionRequest {
    @NotBlank
    private String name;
    
    private String description;
    
    @NotNull
    private Position.PositionType type;
    
    @NotNull
    @Min(1)
    private Integer requiredCount;
    
    private String location;
}
