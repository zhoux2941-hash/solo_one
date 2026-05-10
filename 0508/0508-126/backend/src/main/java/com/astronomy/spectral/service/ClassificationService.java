package com.astronomy.spectral.service;

import com.astronomy.spectral.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClassificationService {

    @Autowired
    private SpectrumService spectrumService;

    public MatchResult classify(String selectedType, double selectedTemperature, 
                                String targetType, double targetTemperature,
                                List<Double> targetIntensities) {
        Spectrum userSpectrum = spectrumService.generateSpectrum(selectedType, selectedTemperature);
        double correlation = spectrumService.calculateCorrelation(
                targetIntensities, 
                userSpectrum.getIntensities()
        );

        double matchScore = (correlation + 1) / 2 * 100;
        boolean isCorrect = selectedType.equals(targetType) && 
                           Math.abs(selectedTemperature - targetTemperature) < 2000;

        StarTypeInfo correctInfo = spectrumService.getStarTypeInfo(targetType);

        String explanation = String.format(
            "这是一颗%s型星，表面温度约%.0fK，呈现%s颜色。%s",
            targetType, targetTemperature, 
            correctInfo.getColorName(), 
            correctInfo.getDescription()
        );

        MatchResult result = new MatchResult();
        result.setSelectedType(selectedType);
        result.setSelectedTemperature(selectedTemperature);
        result.setCorrectType(targetType);
        result.setCorrectTemperature(targetTemperature);
        result.setCorrelation(correlation);
        result.setMatchScore(matchScore);
        result.setCorrect(isCorrect);
        result.setExplanation(explanation);
        result.setColor(correctInfo.getColor());

        return result;
    }
}
