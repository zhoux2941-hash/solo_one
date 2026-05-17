package com.metro.inspection.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SectionDensityDTO {
    private String section;
    private Long totalCount;
    private Long level1;
    private Long level2;
    private Long level3;
    private Double density;
}
