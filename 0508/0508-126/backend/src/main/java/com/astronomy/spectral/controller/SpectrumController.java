package com.astronomy.spectral.controller;

import com.astronomy.spectral.model.*;
import com.astronomy.spectral.repository.ClassificationRecordRepository;
import com.astronomy.spectral.service.ClassificationService;
import com.astronomy.spectral.service.SpectrumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/spectrum")
@CrossOrigin(origins = "http://localhost:5173")
public class SpectrumController {

    @Autowired
    private SpectrumService spectrumService;

    @Autowired
    private ClassificationService classificationService;

    @Autowired
    private ClassificationRecordRepository recordRepository;

    @GetMapping("/types")
    public List<String> getTypes() {
        return spectrumService.getAllTypes();
    }

    @GetMapping("/types/{type}")
    public StarTypeInfo getTypeInfo(@PathVariable String type) {
        return spectrumService.getStarTypeInfo(type);
    }

    @GetMapping("/generate")
    public Spectrum generateSpectrum(
            @RequestParam String type,
            @RequestParam double temperature) {
        return spectrumService.generateSpectrum(type, temperature);
    }

    @GetMapping("/target")
    public Spectrum getRandomTarget() {
        return spectrumService.generateRandomTargetSpectrum();
    }

    @GetMapping("/sdss/{type}")
    public Spectrum getSdssSample(@PathVariable String type) {
        return spectrumService.generateSdssSample(type);
    }

    @PostMapping("/classify")
    public Map<String, Object> classify(@RequestBody Map<String, Object> request) {
        String selectedType = (String) request.get("selectedType");
        double selectedTemperature = ((Number) request.get("selectedTemperature")).doubleValue();
        String targetType = (String) request.get("targetType");
        double targetTemperature = ((Number) request.get("targetTemperature")).doubleValue();
        
        @SuppressWarnings("unchecked")
        List<Double> targetIntensities = (List<Double>) request.get("targetIntensities");

        MatchResult result = classificationService.classify(
                selectedType, selectedTemperature,
                targetType, targetTemperature,
                targetIntensities
        );

        ClassificationRecord record = new ClassificationRecord();
        record.setUserId("anonymous");
        record.setTargetType(targetType);
        record.setUserSelection(selectedType);
        record.setCorrect(result.isCorrect());
        record.setScore(result.getMatchScore());
        recordRepository.save(record);

        Map<String, Object> response = new HashMap<>();
        response.put("result", result);

        long total = recordRepository.countByUserId("anonymous");
        long correct = recordRepository.countCorrectByUserId("anonymous");
        double accuracy = total > 0 ? (double) correct / total * 100 : 0;
        
        response.put("totalAttempts", total);
        response.put("correctAttempts", correct);
        response.put("accuracy", accuracy);

        return response;
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        long total = recordRepository.countByUserId("anonymous");
        long correct = recordRepository.countCorrectByUserId("anonymous");
        double accuracy = total > 0 ? (double) correct / total * 100 : 0;
        
        stats.put("totalAttempts", total);
        stats.put("correctAttempts", correct);
        stats.put("accuracy", accuracy);
        return stats;
    }
}
