package com.exoplanet.service;

import com.exoplanet.dto.FitRequest;
import com.exoplanet.dto.FitResponse;
import com.exoplanet.entity.FitResult;
import com.exoplanet.repository.FitResultRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FitService {

    private final TransitService transitService;
    private final FitResultRepository fitResultRepository;
    private final ObjectMapper objectMapper;

    public FitResponse calculateFit(FitRequest request) {
        log.debug("Starting fit calculation");

        List<Double> fittedFlux = transitService.generateFitCurve(
                request.getStarRadius(),
                request.getStarTemperature(),
                request.getFittedPlanetRadius(),
                request.getOrbitalPeriod(),
                request.getFittedInclination(),
                request.getNumPoints(),
                request.getNumPeriods()
        );

        List<Double> observedFlux = request.getObservedData();
        double chiSquared = calculateChiSquared(observedFlux, fittedFlux);
        double reducedChiSquared = chiSquared / (observedFlux.size() - 2);
        double matchingDegree = calculateMatchingDegree(chiSquared, observedFlux);

        List<Double> time = transitService.generateTimeAxis(
                request.getOrbitalPeriod(),
                request.getNumPoints(),
                request.getNumPeriods()
        );

        return FitResponse.builder()
                .time(time)
                .observedFlux(observedFlux)
                .fittedFlux(fittedFlux)
                .chiSquared(chiSquared)
                .reducedChiSquared(reducedChiSquared)
                .matchingDegree(matchingDegree)
                .fittedPlanetRadius(request.getFittedPlanetRadius())
                .fittedInclination(request.getFittedInclination())
                .build();
    }

    public String saveFitResult(FitRequest request, double chiSquared, double matchingDegree,
                                List<Double> observedFlux, List<Double> fittedFlux) {
        String shareToken = generateShareToken();

        while (fitResultRepository.existsByShareToken(shareToken)) {
            shareToken = generateShareToken();
        }

        FitResult fitResult = new FitResult();
        fitResult.setShareToken(shareToken);
        fitResult.setStarRadius(request.getStarRadius());
        fitResult.setStarTemperature(request.getStarTemperature());
        fitResult.setPlanetRadius(request.getOriginalPlanetRadius());
        fitResult.setOrbitalPeriod(request.getOrbitalPeriod());
        fitResult.setInclination(request.getOriginalInclination());
        fitResult.setFittedPlanetRadius(request.getFittedPlanetRadius());
        fitResult.setFittedInclination(request.getFittedInclination());
        fitResult.setChiSquared(chiSquared);
        fitResult.setMatchingDegree(matchingDegree);
        fitResult.setNoiseLevel(request.getNoiseLevel());

        try {
            fitResult.setOriginalData(objectMapper.writeValueAsString(observedFlux));
            fitResult.setFitData(objectMapper.writeValueAsString(fittedFlux));
        } catch (JsonProcessingException e) {
            log.error("Error serializing fit data", e);
            throw new RuntimeException("Failed to serialize fit data", e);
        }

        fitResultRepository.save(fitResult);
        log.info("Saved fit result with token: {}", shareToken);

        return shareToken;
    }

    @Cacheable(value = "fitResults", key = "#shareToken")
    public FitResult getFitResult(String shareToken) {
        log.debug("Getting fit result for token: {}", shareToken);
        return fitResultRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new RuntimeException("Fit result not found with token: " + shareToken));
    }

    private double calculateChiSquared(List<Double> observed, List<Double> expected) {
        if (observed.size() != expected.size()) {
            throw new IllegalArgumentException("Observed and expected data must have the same size");
        }

        double chiSquared = 0.0;
        for (int i = 0; i < observed.size(); i++) {
            double obs = observed.get(i);
            double exp = expected.get(i);
            double variance = Math.max(0.0001, Math.abs(exp));
            chiSquared += Math.pow(obs - exp, 2) / variance;
        }

        return chiSquared;
    }

    private double calculateMatchingDegree(double chiSquared, List<Double> data) {
        int n = data.size();
        double normalizedChi = chiSquared / n;
        double matchingDegree = 1.0 / (1.0 + normalizedChi);
        return matchingDegree * 100.0;
    }

    private String generateShareToken() {
        try {
            String input = System.nanoTime() + "-" + Math.random();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes());
            return HexFormat.of().formatHex(hash).substring(0, 16);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to generate share token", e);
        }
    }
}