package com.milktea.predictor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictResponse {
    private String teaBase;
    private List<String> toppings;
    private BigDecimal predictedRating;
    private String ratingDescription;
    private List<RecommendedCombination> similarRecommendations;
    private List<RecommendedCombination> hotCombinations;
}
