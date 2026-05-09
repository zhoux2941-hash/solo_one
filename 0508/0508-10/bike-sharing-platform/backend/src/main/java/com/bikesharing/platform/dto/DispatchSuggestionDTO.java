package com.bikesharing.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchSuggestionDTO {
    private Long fromPointId;
    private String fromPointName;
    private Long toPointId;
    private String toPointName;
    private Integer bikeCount;
    private String reason;
    private Double estimatedDistance;
}
