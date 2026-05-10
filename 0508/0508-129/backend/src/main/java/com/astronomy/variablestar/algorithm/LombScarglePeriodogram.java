package com.astronomy.variablestar.algorithm;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public class LombScarglePeriodogram {

    public static class PeriodResult {
        private double period;
        private double frequency;
        private double power;
        private double fap;
        private boolean significant;

        public PeriodResult(double period, double frequency, double power) {
            this.period = period;
            this.frequency = frequency;
            this.power = power;
        }

        public double getPeriod() { return period; }
        public double getFrequency() { return frequency; }
        public double getPower() { return power; }
        public double getFap() { return fap; }
        public boolean isSignificant() { return significant; }

        public void setFap(double fap) { this.fap = fap; }
        public void setSignificant(boolean significant) { this.significant = significant; }
    }

    public static class PeriodogramResult {
        private List<PeriodResult> peaks;
        private double[] frequencies;
        private double[] powers;
        private double bestPeriod;
        private double bestPower;
        private double falseAlarmProbability;
        private List<Double> candidatePeriods;

        public List<PeriodResult> getPeaks() { return peaks; }
        public double[] getFrequencies() { return frequencies; }
        public double[] getPowers() { return powers; }
        public double getBestPeriod() { return bestPeriod; }
        public double getBestPower() { return bestPower; }
        public double getFalseAlarmProbability() { return falseAlarmProbability; }
        public List<Double> getCandidatePeriods() { return candidatePeriods; }

        public void setPeaks(List<PeriodResult> peaks) { this.peaks = peaks; }
        public void setFrequencies(double[] frequencies) { this.frequencies = frequencies; }
        public void setPowers(double[] powers) { this.powers = powers; }
        public void setBestPeriod(double bestPeriod) { this.bestPeriod = bestPeriod; }
        public void setBestPower(double bestPower) { this.bestPower = bestPower; }
        public void setFalseAlarmProbability(double falseAlarmProbability) { 
            this.falseAlarmProbability = falseAlarmProbability; 
        }
        public void setCandidatePeriods(List<Double> candidatePeriods) { 
            this.candidatePeriods = candidatePeriods; 
        }
    }

    public static PeriodogramResult compute(double[] times, double[] values, double[] errors) {
        if (times == null || values == null || times.length != values.length || times.length < 5) {
            throw new IllegalArgumentException("时间序列数据不足，至少需要5个观测点");
        }

        int n = times.length;
        double[] y = new double[n];
        double[] w = new double[n];

        double sumW = 0;
        double sumWY = 0;
        for (int i = 0; i < n; i++) {
            if (errors != null && errors[i] > 0) {
                w[i] = 1.0 / (errors[i] * errors[i]);
            } else {
                w[i] = 1.0;
            }
            sumW += w[i];
            sumWY += w[i] * values[i];
        }
        double mean = sumWY / sumW;

        for (int i = 0; i < n; i++) {
            y[i] = values[i] - mean;
        }

        double minTime = Double.MAX_VALUE;
        double maxTime = Double.MIN_VALUE;
        for (double t : times) {
            minTime = Math.min(minTime, t);
            maxTime = Math.max(maxTime, t);
        }
        double timeSpan = maxTime - minTime;

        if (timeSpan <= 0) {
            throw new IllegalArgumentException("时间跨度必须大于0");
        }

        double minFreq = 1.0 / Math.max(timeSpan * 10, 1000.0);
        double maxFreq = 1.0 / 0.01;

        double[] uniqueTimes = Arrays.copyOf(times, n);
        Arrays.sort(uniqueTimes);
        double minInterval = Double.MAX_VALUE;
        for (int i = 1; i < n; i++) {
            double interval = uniqueTimes[i] - uniqueTimes[i-1];
            if (interval > 0) {
                minInterval = Math.min(minInterval, interval);
            }
        }
        if (minInterval > 0) {
            maxFreq = Math.min(maxFreq, 2.0 / minInterval);
        }

        int oversampling = 4;
        int freqCount = (int) Math.ceil(oversampling * n * Math.log(n));
        freqCount = Math.max(freqCount, 1000);
        freqCount = Math.min(freqCount, 100000);

        double[] frequencies = new double[freqCount];
        double[] powers = new double[freqCount];

        double logMinFreq = Math.log10(minFreq);
        double logMaxFreq = Math.log10(maxFreq);
        double logStep = (logMaxFreq - logMinFreq) / (freqCount - 1);

        for (int i = 0; i < freqCount; i++) {
            frequencies[i] = Math.pow(10, logMinFreq + i * logStep);
            powers[i] = computeLombScarglePower(times, y, w, frequencies[i], sumW);
        }

        List<PeriodResult> peaks = findPeaks(frequencies, powers, 5);

        PeriodogramResult result = new PeriodogramResult();
        result.setFrequencies(frequencies);
        result.setPowers(powers);
        result.setPeaks(peaks);

        if (!peaks.isEmpty()) {
            PeriodResult bestPeak = peaks.get(0);
            result.setBestPeriod(bestPeak.getPeriod());
            result.setBestPower(bestPeak.getPower());

            double fap = calculateFalseAlarmProbability(powers, bestPeak.getPower(), n);
            result.setFalseAlarmProbability(fap);

            List<Double> candidates = new ArrayList<>();
            for (int i = 0; i < Math.min(5, peaks.size()); i++) {
                candidates.add(peaks.get(i).getPeriod());
            }
            result.setCandidatePeriods(candidates);
        }

        return result;
    }

    private static double computeLombScarglePower(double[] t, double[] y, double[] w, 
                                                   double freq, double sumW) {
        int n = t.length;
        double omega = 2 * Math.PI * freq;

        double sumWsin = 0;
        double sumWcos = 0;
        double sumWysin = 0;
        double sumWycos = 0;

        for (int i = 0; i < n; i++) {
            double angle = omega * t[i];
            double sin = Math.sin(angle);
            double cos = Math.cos(angle);
            sumWsin += w[i] * sin;
            sumWcos += w[i] * cos;
            sumWysin += w[i] * y[i] * sin;
            sumWycos += w[i] * y[i] * cos;
        }

        double tau = Math.atan2(2 * sumWsin, 2 * sumWcos) / (2 * omega);

        double YC = 0, YS = 0, CC = 0, SS = 0;
        for (int i = 0; i < n; i++) {
            double angle = omega * (t[i] - tau);
            double sin = Math.sin(angle);
            double cos = Math.cos(angle);
            YC += w[i] * y[i] * cos;
            YS += w[i] * y[i] * sin;
            CC += w[i] * cos * cos;
            SS += w[i] * sin * sin;
        }

        double power = 0.5 * (YC * YC / CC + YS * YS / SS);

        double sumWY2 = 0;
        for (int i = 0; i < n; i++) {
            sumWY2 += w[i] * y[i] * y[i];
        }

        if (sumWY2 > 0) {
            power = power / (0.5 * sumWY2);
        }

        return power;
    }

    private static List<PeriodResult> findPeaks(double[] frequencies, double[] powers, int minDistance) {
        List<PeriodResult> peaks = new ArrayList<>();
        int n = frequencies.length;

        for (int i = 1; i < n - 1; i++) {
            if (powers[i] > powers[i-1] && powers[i] > powers[i+1]) {
                boolean isLocalMax = true;
                for (int j = Math.max(0, i - minDistance); j < Math.min(n, i + minDistance + 1); j++) {
                    if (j != i && powers[j] > powers[i]) {
                        isLocalMax = false;
                        break;
                    }
                }
                if (isLocalMax) {
                    double freq = frequencies[i];
                    double period = 1.0 / freq;
                    peaks.add(new PeriodResult(period, freq, powers[i]));
                }
            }
        }

        peaks.sort(Comparator.comparingDouble(PeriodResult::getPower).reversed());
        return peaks;
    }

    private static double calculateFalseAlarmProbability(double[] powers, double maxPower, int n) {
        double meanPower = 0;
        for (double p : powers) {
            meanPower += p;
        }
        meanPower /= powers.length;

        double effN = n * (1 - 1.0 / (2 * n));
        double z = maxPower / meanPower;

        double fap = 1 - Math.pow(1 - Math.exp(-z), effN);

        return Math.max(0, Math.min(1, fap));
    }

    public static double[] phaseFold(double[] times, double[] values, double period, double epoch) {
        int n = times.length;
        double[] phases = new double[n];

        for (int i = 0; i < n; i++) {
            double phase = ((times[i] - epoch) % period) / period;
            if (phase < 0) phase += 1;
            phases[i] = phase;
        }

        return phases;
    }
}
