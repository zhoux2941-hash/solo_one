package com.fishing.dto;

import lombok.Data;

@Data
public class HeatmapDataDTO {
    private Integer month;
    private String monthName;
    private Long speciesId;
    private String speciesName;
    private Long count;
}
