package com.astronomy.variablestar.algorithm;

import java.util.ArrayList;
import java.util.List;

public class ConvolutionSmoother {

    public enum SmoothMethod {
        MOVING_AVERAGE("移动平均"),
        WEIGHTED_MOVING_AVERAGE("加权移动平均"),
        SAVITZKY_GOLAY("Savitzky-Golay滤波"),
        MEDIAN_FILTER("中值滤波"),
        GAUSSIAN("高斯平滑");

        private final String label;
        SmoothMethod(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    public static class SmoothResult {
        private double[] smoothedValues;
        private double[] originalValues;
        private double[] smoothedPhases;
        private double[] residuals;
        private double rms;
        private double chiSquare;
        private SmoothMethod method;
        private int windowSize;
        private List<double[]> foldedPoints;

        public double[] getSmoothedValues() { return smoothedValues; }
        public double[] getOriginalValues() { return originalValues; }
        public double[] getSmoothedPhases() { return smoothedPhases; }
        public double[] getResiduals() { return residuals; }
        public double getRms() { return rms; }
        public double getChiSquare() { return chiSquare; }
        public SmoothMethod getMethod() { return method; }
        public int getWindowSize() { return windowSize; }
        public List<double[]> getFoldedPoints() { return foldedPoints; }

        public void setSmoothedValues(double[] smoothedValues) { this.smoothedValues = smoothedValues; }
        public void setOriginalValues(double[] originalValues) { this.originalValues = originalValues; }
        public void setSmoothedPhases(double[] smoothedPhases) { this.smoothedPhases = smoothedPhases; }
        public void setResiduals(double[] residuals) { this.residuals = residuals; }
        public void setRms(double rms) { this.rms = rms; }
        public void setChiSquare(double chiSquare) { this.chiSquare = chiSquare; }
        public void setMethod(SmoothMethod method) { this.method = method; }
        public void setWindowSize(int windowSize) { this.windowSize = windowSize; }
        public void setFoldedPoints(List<double[]> foldedPoints) { this.foldedPoints = foldedPoints; }
    }

    public static SmoothResult smooth(double[] phases, double[] values, double[] errors,
                                       SmoothMethod method, int windowSize) {
        if (phases == null || values == null || phases.length != values.length) {
            throw new IllegalArgumentException("输入数组长度不一致");
        }

        int n = phases.length;
        if (n < 5) {
            throw new IllegalArgumentException("至少需要5个数据点");
        }

        int[] indices = new int[n];
        for (int i = 0; i < n; i++) indices[i] = i;
        
        quickSort(phases, values, errors, indices, 0, n - 1);

        double[] sortedPhases = new double[n];
        double[] sortedValues = new double[n];
        double[] sortedErrors = errors != null ? new double[n] : null;
        
        for (int i = 0; i < n; i++) {
            sortedPhases[i] = phases[indices[i]];
            sortedValues[i] = values[indices[i]];
            if (errors != null) {
                sortedErrors[i] = errors[indices[i]];
            }
        }

        double[] smoothed;
        switch (method) {
            case MOVING_AVERAGE:
                smoothed = movingAverage(sortedValues, windowSize);
                break;
            case WEIGHTED_MOVING_AVERAGE:
                smoothed = weightedMovingAverage(sortedValues, sortedErrors, windowSize);
                break;
            case SAVITZKY_GOLAY:
                smoothed = savitzkyGolay(sortedValues, windowSize);
                break;
            case MEDIAN_FILTER:
                smoothed = medianFilter(sortedValues, windowSize);
                break;
            case GAUSSIAN:
                smoothed = gaussianSmooth(sortedPhases, sortedValues, windowSize);
                break;
            default:
                smoothed = movingAverage(sortedValues, windowSize);
        }

        double[] residuals = new double[n];
        double sumResidual = 0;
        double chiSquare = 0;
        for (int i = 0; i < n; i++) {
            residuals[i] = sortedValues[i] - smoothed[i];
            sumResidual += residuals[i] * residuals[i];
            if (sortedErrors != null && sortedErrors[i] > 0) {
                chiSquare += residuals[i] * residuals[i] / (sortedErrors[i] * sortedErrors[i]);
            }
        }

        SmoothResult result = new SmoothResult();
        result.setSmoothedPhases(sortedPhases);
        result.setSmoothedValues(smoothed);
        result.setOriginalValues(sortedValues);
        result.setResiduals(residuals);
        result.setRms(Math.sqrt(sumResidual / n));
        result.setChiSquare(errors != null ? chiSquare / (n - 1) : Double.NaN);
        result.setMethod(method);
        result.setWindowSize(windowSize);

        return result;
    }

    private static double[] movingAverage(double[] values, int windowSize) {
        int n = values.length;
        double[] result = new double[n];
        int halfWindow = windowSize / 2;

        for (int i = 0; i < n; i++) {
            double sum = 0;
            int count = 0;
            for (int j = Math.max(0, i - halfWindow); j <= Math.min(n - 1, i + halfWindow); j++) {
                sum += values[j];
                count++;
            }
            result[i] = sum / count;
        }
        return result;
    }

    private static double[] weightedMovingAverage(double[] values, double[] errors, int windowSize) {
        int n = values.length;
        double[] result = new double[n];
        int halfWindow = windowSize / 2;

        for (int i = 0; i < n; i++) {
            double weightedSum = 0;
            double totalWeight = 0;
            for (int j = Math.max(0, i - halfWindow); j <= Math.min(n - 1, i + halfWindow); j++) {
                double weight = 1.0;
                if (errors != null && errors[j] > 0) {
                    weight = 1.0 / (errors[j] * errors[j]);
                }
                int distance = Math.abs(j - i);
                weight *= Math.exp(-distance * 0.5);
                weightedSum += values[j] * weight;
                totalWeight += weight;
            }
            result[i] = totalWeight > 0 ? weightedSum / totalWeight : values[i];
        }
        return result;
    }

    private static double[] savitzkyGolay(double[] values, int windowSize) {
        int n = values.length;
        double[] result = new double[n];
        int halfWindow = windowSize / 2;

        double[] coeffs = savitzkyGolayCoefficients(windowSize, 2);

        for (int i = 0; i < n; i++) {
            if (i < halfWindow || i >= n - halfWindow) {
                double sum = 0;
                int count = 0;
                for (int j = Math.max(0, i - halfWindow); j <= Math.min(n - 1, i + halfWindow); j++) {
                    sum += values[j];
                    count++;
                }
                result[i] = sum / count;
            } else {
                double sum = 0;
                double norm = 0;
                for (int j = 0; j < windowSize; j++) {
                    sum += values[i - halfWindow + j] * coeffs[j];
                    norm += coeffs[j];
                }
                result[i] = norm > 0 ? sum / norm : values[i];
            }
        }
        return result;
    }

    private static double[] savitzkyGolayCoefficients(int windowSize, int order) {
        int halfWindow = windowSize / 2;
        double[][] A = new double[windowSize][order + 1];
        
        for (int i = 0; i < windowSize; i++) {
            double x = i - halfWindow;
            for (int j = 0; j <= order; j++) {
                A[i][j] = Math.pow(x, j);
            }
        }

        double[][] AtA = new double[order + 1][order + 1];
        for (int i = 0; i <= order; i++) {
            for (int j = 0; j <= order; j++) {
                for (int k = 0; k < windowSize; k++) {
                    AtA[i][j] += A[k][i] * A[k][j];
                }
            }
        }

        double[][] AtAInv = invertMatrix(AtA);

        double[] coeffs = new double[windowSize];
        for (int i = 0; i < windowSize; i++) {
            for (int j = 0; j <= order; j++) {
                coeffs[i] += A[i][j] * AtAInv[0][j];
            }
        }

        return coeffs;
    }

    private static double[][] invertMatrix(double[][] matrix) {
        int n = matrix.length;
        double[][] augmented = new double[n][2 * n];
        
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                augmented[i][j] = matrix[i][j];
            }
            augmented[i][i + n] = 1.0;
        }

        for (int col = 0; col < n; col++) {
            int pivotRow = col;
            for (int row = col + 1; row < n; row++) {
                if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) {
                    pivotRow = row;
                }
            }
            
            double[] temp = augmented[col];
            augmented[col] = augmented[pivotRow];
            augmented[pivotRow] = temp;

            double div = augmented[col][col];
            for (int j = 0; j < 2 * n; j++) {
                augmented[col][j] /= div;
            }

            for (int row = 0; row < n; row++) {
                if (row != col) {
                    double factor = augmented[row][col];
                    for (int j = 0; j < 2 * n; j++) {
                        augmented[row][j] -= factor * augmented[col][j];
                    }
                }
            }
        }

        double[][] inverse = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                inverse[i][j] = augmented[i][j + n];
            }
        }
        return inverse;
    }

    private static double[] medianFilter(double[] values, int windowSize) {
        int n = values.length;
        double[] result = new double[n];
        int halfWindow = windowSize / 2;

        for (int i = 0; i < n; i++) {
            List<Double> window = new ArrayList<>();
            for (int j = Math.max(0, i - halfWindow); j <= Math.min(n - 1, i + halfWindow); j++) {
                window.add(values[j]);
            }
            window.sort(Double::compare);
            int mid = window.size() / 2;
            result[i] = window.size() % 2 == 1 ? window.get(mid) : 
                       (window.get(mid - 1) + window.get(mid)) / 2.0;
        }
        return result;
    }

    private static double[] gaussianSmooth(double[] x, double[] y, int windowSize) {
        int n = x.length;
        double[] result = new double[n];
        double sigma = windowSize / 6.0;

        for (int i = 0; i < n; i++) {
            double sum = 0;
            double totalWeight = 0;
            for (int j = 0; j < n; j++) {
                double distance = x[i] - x[j];
                double weight = Math.exp(-(distance * distance) / (2 * sigma * sigma));
                sum += y[j] * weight;
                totalWeight += weight;
            }
            result[i] = totalWeight > 0 ? sum / totalWeight : y[i];
        }
        return result;
    }

    public static SmoothResult phaseFoldAndSmooth(double[] times, double[] values, double[] errors,
                                                   double period, double epoch,
                                                   SmoothMethod method, int windowSize,
                                                   int phaseBins) {
        if (times == null || values == null || times.length != values.length) {
            throw new IllegalArgumentException("输入数组长度不一致");
        }

        int n = times.length;
        double[] phases = new double[n];
        for (int i = 0; i < n; i++) {
            double phase = ((times[i] - epoch) % period) / period;
            if (phase < 0) phase += 1.0;
            phases[i] = phase;
        }

        List<double[]> foldedPoints = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            foldedPoints.add(new double[]{phases[i], values[i], errors != null ? errors[i] : 0.1});
            if (phases[i] < 0.5) {
                foldedPoints.add(new double[]{phases[i] + 1.0, values[i], errors != null ? errors[i] : 0.1});
            }
        }

        double[] binPhases = new double[phaseBins];
        double[] binValues = new double[phaseBins];
        double[] binErrors = new double[phaseBins];
        double[] binWeights = new double[phaseBins];

        double binWidth = 1.5 / phaseBins;
        for (int i = 0; i < phaseBins; i++) {
            binPhases[i] = i * binWidth;
        }

        for (double[] point : foldedPoints) {
            double phase = point[0];
            double value = point[1];
            double error = point[2];
            double weight = error > 0 ? 1.0 / (error * error) : 1.0;

            for (int i = 0; i < phaseBins; i++) {
                double distance = Math.abs(phase - binPhases[i]);
                if (distance < binWidth) {
                    double kernelWeight = weight * (1.0 - distance / binWidth);
                    binValues[i] += value * kernelWeight;
                    binErrors[i] += error * error * kernelWeight;
                    binWeights[i] += kernelWeight;
                }
            }
        }

        List<Double> validPhases = new ArrayList<>();
        List<Double> validValues = new ArrayList<>();
        List<Double> validErrors = new ArrayList<>();

        for (int i = 0; i < phaseBins; i++) {
            if (binWeights[i] > 0) {
                validPhases.add(binPhases[i]);
                validValues.add(binValues[i] / binWeights[i]);
                validErrors.add(Math.sqrt(binErrors[i] / binWeights[i]));
            }
        }

        if (validPhases.isEmpty()) {
            SmoothResult result = new SmoothResult();
            result.setFoldedPoints(foldedPoints);
            return result;
        }

        double[] vPhases = validPhases.stream().mapToDouble(Double::doubleValue).toArray();
        double[] vValues = validValues.stream().mapToDouble(Double::doubleValue).toArray();
        double[] vErrors = validErrors.stream().mapToDouble(Double::doubleValue).toArray();

        SmoothResult result = smooth(vPhases, vValues, vErrors, method, windowSize);
        result.setFoldedPoints(foldedPoints);
        
        return result;
    }

    private static void quickSort(double[] phases, double[] values, double[] errors,
                                  int[] indices, int low, int high) {
        if (low < high) {
            int pi = partition(phases, indices, low, high);
            quickSort(phases, values, errors, indices, low, pi - 1);
            quickSort(phases, values, errors, indices, pi + 1, high);
        }
    }

    private static int partition(double[] phases, int[] indices, int low, int high) {
        double pivot = phases[indices[high]];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (phases[indices[j]] < pivot) {
                i++;
                int temp = indices[i];
                indices[i] = indices[j];
                indices[j] = temp;
            }
        }
        int temp = indices[i + 1];
        indices[i + 1] = indices[high];
        indices[high] = temp;
        return i + 1;
    }
}
