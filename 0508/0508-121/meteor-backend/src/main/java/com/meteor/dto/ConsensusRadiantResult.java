package com.meteor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsensusRadiantResult {
    private String meteorShowerName;
    private String consensusConstellation;
    private Double consensusRA;
    private Double consensusDec;
    private Integer totalSessions;
    private Integer sessionsWithRadiant;
    private Map<String, Long> constellationCounts;
    private Double confidence;
}
