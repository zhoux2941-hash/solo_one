package com.astronomy.spectral.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchResult {
    private String selectedType;
    private double selectedTemperature;
    private String correctType;
    private double correctTemperature;
    private double correlation;
    private double matchScore;
    private boolean isCorrect;
    private String explanation;
    private String color;
}
