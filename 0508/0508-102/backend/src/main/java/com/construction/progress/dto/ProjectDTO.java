package com.construction.progress.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class ProjectDTO {
    @NotBlank
    private String ownerName;
    
    @NotBlank
    private String address;
    
    @NotNull
    private BigDecimal area;
}
