package com.meteor.util;

import com.meteor.entity.EmissionLine;
import com.meteor.entity.MeteorSpectra;
import com.meteor.entity.SpectrumDataPoint;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Collections;

public class SpectrumExtractor {
    
    public static List<SpectrumDataPoint> extractSpectrum(
            File imageFile,
            MeteorSpectra spectra) throws IOException {
        
        BufferedImage image = ImageIO.read(imageFile);
        if (image == null) {
            throw new IOException("Cannot read image file");
        }
        
        int startX = spectra.getStartPixelX();
        int startY = spectra.getStartPixelY();
        int endX = spectra.getEndPixelX();
        int endY = spectra.getEndPixelY();
        
        double minWavelength = spectra.getMinWavelength();
        double maxWavelength = spectra.getMaxWavelength();
        
        int dx = endX - startX;
        int dy = endY - startY;
        int numPoints = (int) Math.sqrt(dx * dx + dy * dy);
        
        if (numPoints < 2) {
            numPoints = Math.max(Math.abs(dx), Math.abs(dy));
        }
        
        double perpX = -dy;
        double perpY = dx;
        double perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
        if (perpLength > 0) {
            perpX /= perpLength;
            perpY /= perpLength;
        }
        
        int profileWidth = 5;
        
        List<SpectrumDataPoint> dataPoints = new ArrayList<>();
        
        for (int i = 0; i < numPoints; i++) {
            double t = (double) i / (numPoints - 1);
            int centerX = (int) Math.round(startX + t * dx);
            int centerY = (int) Math.round(startY + t * dy);
            
            double totalIntensity = 0;
            int validPixels = 0;
            
            for (int w = -profileWidth; w <= profileWidth; w++) {
                int x = (int) Math.round(centerX + perpX * w);
                int y = (int) Math.round(centerY + perpY * w);
                
                if (x >= 0 && x < image.getWidth() && y >= 0 && y < image.getHeight()) {
                    int rgb = image.getRGB(x, y);
                    int r = (rgb >> 16) & 0xFF;
                    int g = (rgb >> 8) & 0xFF;
                    int b = rgb & 0xFF;
                    
                    totalIntensity += (r + g + b) / 3.0;
                    validPixels++;
                }
            }
            
            double intensity = validPixels > 0 ? totalIntensity / validPixels : 0;
            
            double wavelength = minWavelength + t * (maxWavelength - minWavelength);
            
            SpectrumDataPoint point = new SpectrumDataPoint();
            point.setMeteorSpectra(spectra);
            point.setWavelength(wavelength);
            point.setIntensity(intensity);
            point.setPixelIndex(i);
            
            dataPoints.add(point);
        }
        
        return dataPoints;
    }
    
    public static List<EmissionLine> detectEmissionLines(
            List<SpectrumDataPoint> spectrumData,
            MeteorSpectra spectra,
            double tolerance) {
        
        List<EmissionLine> detectedLines = new ArrayList<>();
        
        if (spectrumData == null || spectrumData.size() < 20) {
            return detectedLines;
        }
        
        double[] intensities = new double[spectrumData.size()];
        for (int i = 0; i < spectrumData.size(); i++) {
            intensities[i] = spectrumData.get(i).getIntensity();
        }
        
        double[] smoothed = savitzkyGolaySmooth(intensities, 7, 2);
        
        double[] baseline = robustBaselineEstimation(smoothed, 100);
        
        double[] signal = new double[smoothed.length];
        for (int i = 0; i < smoothed.length; i++) {
            signal[i] = Math.max(0, smoothed[i] - baseline[i]);
        }
        
        double noiseLevel = estimateNoiseLevel(signal);
        
        List<PeakCandidate> candidates = findPeaksWithValidation(signal, noiseLevel, intensities.length);
        
        for (PeakCandidate candidate : candidates) {
            SpectrumDataPoint peakPoint = spectrumData.get(candidate.index);
            double peakWavelength = peakPoint.getWavelength();
            
            for (Map.Entry<String, Double> entry : EmissionLineDatabase.COMMON_LINES.entrySet()) {
                String lineName = entry.getKey();
                double knownWavelength = entry.getValue();
                
                if (Math.abs(peakWavelength - knownWavelength) <= tolerance) {
                    EmissionLine line = new EmissionLine();
                    line.setMeteorSpectra(spectra);
                    line.setElement(EmissionLineDatabase.getElementName(lineName));
                    line.setWavelength(knownWavelength);
                    line.setIntensity(candidate.height);
                    line.setIsAutoDetected(true);
                    line.setNotes(String.format("Auto-detected: %s (SNR=%.1f, width=%d)", 
                            lineName, candidate.snr, candidate.width));
                    
                    boolean alreadyExists = detectedLines.stream()
                            .anyMatch(l -> Math.abs(l.getWavelength() - knownWavelength) < 0.1);
                    
                    if (!alreadyExists) {
                        detectedLines.add(line);
                    }
                    break;
                }
            }
        }
        
        return detectedLines;
    }
    
    private static double[] savitzkyGolaySmooth(double[] data, int windowSize, int polynomialOrder) {
        int halfWindow = windowSize / 2;
        double[] smoothed = new double[data.length];
        
        double[] coefficients = getSavitzkyGolayCoefficients(windowSize, polynomialOrder);
        
        for (int i = 0; i < data.length; i++) {
            double sum = 0;
            double norm = 0;
            
            for (int j = -halfWindow; j <= halfWindow; j++) {
                int idx = i + j;
                if (idx >= 0 && idx < data.length) {
                    int coeffIdx = j + halfWindow;
                    sum += data[idx] * coefficients[coeffIdx];
                    norm += coefficients[coeffIdx];
                }
            }
            
            smoothed[i] = norm > 0 ? sum / norm : data[i];
        }
        
        return smoothed;
    }
    
    private static double[] getSavitzkyGolayCoefficients(int windowSize, int order) {
        double[] coeffs = new double[windowSize];
        int halfWindow = windowSize / 2;
        
        switch (windowSize) {
            case 5:
                coeffs = new double[]{-3, 12, 17, 12, -3};
                break;
            case 7:
                coeffs = new double[]{-2, 3, 6, 7, 6, 3, -2};
                break;
            case 9:
                coeffs = new double[]{-21, 14, 39, 54, 59, 54, 39, 14, -21};
                break;
            default:
                for (int i = 0; i < windowSize; i++) {
                    coeffs[i] = 1.0;
                }
        }
        
        return coeffs;
    }
    
    private static double[] robustBaselineEstimation(double[] data, int windowSize) {
        int n = data.length;
        double[] baseline = new double[n];
        
        int iterations = 3;
        
        System.arraycopy(data, 0, baseline, 0, n);
        
        for (int iter = 0; iter < iterations; iter++) {
            double[] temp = new double[n];
            
            for (int i = 0; i < n; i++) {
                int start = Math.max(0, i - windowSize / 2);
                int end = Math.min(n - 1, i + windowSize / 2);
                
                List<Double> window = new ArrayList<>();
                for (int j = start; j <= end; j++) {
                    window.add(baseline[j]);
                }
                
                Collections.sort(window);
                
                int medianIdx = window.size() / 2;
                if (window.size() % 2 == 0) {
                    temp[i] = (window.get(medianIdx - 1) + window.get(medianIdx)) / 2.0;
                } else {
                    temp[i] = window.get(medianIdx);
                }
            }
            
            double[] upperEnvelope = new double[n];
            for (int i = 0; i < n; i++) {
                if (data[i] < temp[i]) {
                    upperEnvelope[i] = data[i];
                } else {
                    upperEnvelope[i] = temp[i];
                }
            }
            
            baseline = upperEnvelope;
        }
        
        double[] finalBaseline = new double[n];
        for (int i = 0; i < n; i++) {
            int start = Math.max(0, i - 10);
            int end = Math.min(n - 1, i + 10);
            
            double sum = 0;
            int count = 0;
            for (int j = start; j <= end; j++) {
                sum += baseline[j];
                count++;
            }
            finalBaseline[i] = sum / count;
        }
        
        return finalBaseline;
    }
    
    private static double estimateNoiseLevel(double[] signal) {
        if (signal.length < 10) {
            return 1.0;
        }
        
        double[] differences = new double[signal.length - 1];
        for (int i = 0; i < signal.length - 1; i++) {
            differences[i] = Math.abs(signal[i + 1] - signal[i]);
        }
        
        List<Double> diffList = new ArrayList<>();
        for (double d : differences) {
            diffList.add(d);
        }
        Collections.sort(diffList);
        
        double medianDiff;
        int mid = diffList.size() / 2;
        if (diffList.size() % 2 == 0) {
            medianDiff = (diffList.get(mid - 1) + diffList.get(mid)) / 2.0;
        } else {
            medianDiff = diffList.get(mid);
        }
        
        double noise = medianDiff / 0.6745;
        
        double globalStd = calculateStandardDeviation(signal);
        
        return Math.max(noise, globalStd * 0.3);
    }
    
    private static double calculateStandardDeviation(double[] data) {
        if (data.length == 0) return 0;
        
        double mean = 0;
        for (double v : data) {
            mean += v;
        }
        mean /= data.length;
        
        double variance = 0;
        for (double v : data) {
            variance += (v - mean) * (v - mean);
        }
        variance /= data.length;
        
        return Math.sqrt(variance);
    }
    
    private static List<PeakCandidate> findPeaksWithValidation(double[] signal, double noiseLevel, int totalPoints) {
        List<PeakCandidate> peaks = new ArrayList<>();
        
        double snrThreshold = 3.0;
        int minPeakWidth = 3;
        int maxPeakWidth = Math.max(10, totalPoints / 20);
        
        for (int i = 3; i < signal.length - 3; i++) {
            if (signal[i] <= signal[i-1]) continue;
            if (signal[i] <= signal[i-2]) continue;
            if (signal[i] <= signal[i-3]) continue;
            if (signal[i] < signal[i+1]) continue;
            if (signal[i] < signal[i+2]) continue;
            if (signal[i] < signal[i+3]) continue;
            
            double snr = signal[i] / Math.max(noiseLevel, 0.01);
            if (snr < snrThreshold) continue;
            
            int leftIdx = findPeakBoundary(signal, i, -1);
            int rightIdx = findPeakBoundary(signal, i, 1);
            
            int peakWidth = rightIdx - leftIdx + 1;
            
            if (peakWidth < minPeakWidth || peakWidth > maxPeakWidth) continue;
            
            double area = calculatePeakArea(signal, leftIdx, rightIdx);
            
            double leftHeight = signal[i] - signal[leftIdx];
            double rightHeight = signal[i] - signal[rightIdx];
            double symmetry = Math.min(leftHeight, rightHeight) / Math.max(leftHeight, rightHeight);
            
            if (symmetry < 0.3) continue;
            
            PeakCandidate candidate = new PeakCandidate();
            candidate.index = i;
            candidate.height = signal[i];
            candidate.snr = snr;
            candidate.width = peakWidth;
            candidate.area = area;
            candidate.symmetry = symmetry;
            
            peaks.add(candidate);
        }
        
        peaks.sort((a, b) -> Double.compare(b.snr * b.area, a.snr * a.area));
        
        List<PeakCandidate> filtered = new ArrayList<>();
        int maxPeaks = 10;
        
        for (PeakCandidate peak : peaks) {
            boolean overlaps = false;
            for (PeakCandidate existing : filtered) {
                if (Math.abs(peak.index - existing.index) < 10) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps && filtered.size() < maxPeaks) {
                filtered.add(peak);
            }
        }
        
        return filtered;
    }
    
    private static int findPeakBoundary(double[] signal, int peakIndex, int direction) {
        double peakValue = signal[peakIndex];
        int boundary = peakIndex;
        double currentValue = peakValue;
        
        while (true) {
            int nextIdx = boundary + direction;
            
            if (nextIdx < 0 || nextIdx >= signal.length) {
                break;
            }
            
            double nextValue = signal[nextIdx];
            
            if (nextValue > currentValue) {
                break;
            }
            
            double dropRatio = (peakValue - nextValue) / peakValue;
            if (dropRatio > 0.5 || nextValue < peakValue * 0.3) {
                break;
            }
            
            boundary = nextIdx;
            currentValue = nextValue;
        }
        
        return boundary;
    }
    
    private static double calculatePeakArea(double[] signal, int leftIdx, int rightIdx) {
        double area = 0;
        double baselineLeft = signal[leftIdx];
        double baselineRight = signal[rightIdx];
        
        for (int i = leftIdx; i <= rightIdx; i++) {
            double t = (double)(i - leftIdx) / (rightIdx - leftIdx);
            double baseline = baselineLeft + t * (baselineRight - baselineLeft);
            area += Math.max(0, signal[i] - baseline);
        }
        
        return area;
    }
    
    private static class PeakCandidate {
        int index;
        double height;
        double snr;
        int width;
        double area;
        double symmetry;
    }
}
