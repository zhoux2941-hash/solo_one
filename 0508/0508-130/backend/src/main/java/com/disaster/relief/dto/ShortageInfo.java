package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShortageInfo {
    private String supplyType;
    private Integer shortageDay;
    private Integer shortageAmount;
    private Integer daysUntilShortage;
}
