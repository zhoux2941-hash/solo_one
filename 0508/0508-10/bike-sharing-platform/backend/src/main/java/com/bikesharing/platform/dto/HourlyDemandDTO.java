package com.bikesharing.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HourlyDemandDTO {
    private Integer hour;
    private Long borrowCount;
    private Long returnCount;
}
