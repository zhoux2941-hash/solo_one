package com.mineral.identification.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class IdentificationConfirmationRequest {
    
    @NotNull(message = "确认的矿物ID不能为空")
    private Long confirmedMineralId;
    
    private BigDecimal inputHardness;
    
    private String inputStreak;
    
    private String inputLuster;
    
    private String inputCleavage;
}
