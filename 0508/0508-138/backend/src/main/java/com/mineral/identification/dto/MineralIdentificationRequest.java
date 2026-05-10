package com.mineral.identification.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MineralIdentificationRequest {
    
    private BigDecimal hardness;
    
    private String streak;
    
    private String luster;
    
    private String cleavage;
}
