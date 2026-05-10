package com.cinema.popcorn.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationRequest {
    
    @NotNull(message = "预期客流量不能为空")
    @Positive(message = "预期客流量必须大于0")
    @Min(value = 1, message = "预期客流量最小为1人")
    @Max(value = 5000, message = "预期客流量最大为5000人")
    private Integer expectedPassengers;
    
    private List<Integer> hourlyDistribution;
    
    private String date;
    
    private Boolean isHoliday;
}
