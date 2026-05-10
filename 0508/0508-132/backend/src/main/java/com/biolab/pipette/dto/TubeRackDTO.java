package com.biolab.pipette.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TubeRackDTO {
    private Long id;
    private String name;
    private Integer rows;
    private Integer columns;
    private List<WellPositionDTO> wells;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}