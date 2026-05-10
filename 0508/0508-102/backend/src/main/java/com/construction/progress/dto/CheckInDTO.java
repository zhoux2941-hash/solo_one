package com.construction.progress.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class CheckInDTO {
    @NotNull
    private Long projectId;
    
    @NotNull
    private BigDecimal dailyProgress;
    
    private String description;
    
    private String imageUrl;
}
