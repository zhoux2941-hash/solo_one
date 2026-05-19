package com.graphdb.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlgorithmRequest {

    private Double dampingFactor = 0.85;
    private Double convergenceThreshold = 1e-6;
    private Integer maxIterations = 100;
    private Double resolution = 1.0;
    private Long sourceVertexId;
    private Integer k;
}