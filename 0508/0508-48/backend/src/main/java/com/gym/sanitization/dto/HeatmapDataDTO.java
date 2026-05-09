package com.gym.sanitization.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapDataDTO {
    private String date;
    private Long equipmentId;
    private String equipmentName;
    private Integer count;
}
