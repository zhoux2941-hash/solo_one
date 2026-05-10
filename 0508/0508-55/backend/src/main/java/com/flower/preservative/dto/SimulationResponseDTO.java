package com.flower.preservative.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationResponseDTO {
    private List<SimulationResultDTO> results;
    private String recommendedFormula;
    private Double bestResult;
    private String sessionId;
}
