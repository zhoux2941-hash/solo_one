package com.wheelchair.util;

import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
public class LinearRegression {

    private final double slope;
    private final double intercept;
    private final double r2;

    public LinearRegression(List<Double> x, List<Double> y) {
        if (x.size() != y.size() || x.size() < 2) {
            throw new IllegalArgumentException("数据点数量不足，无法进行线性回归");
        }

        int n = x.size();
        double sumX = 0.0;
        double sumY = 0.0;
        double sumXY = 0.0;
        double sumX2 = 0.0;
        double sumY2 = 0.0;

        for (int i = 0; i < n; i++) {
            sumX += x.get(i);
            sumY += y.get(i);
            sumXY += x.get(i) * y.get(i);
            sumX2 += x.get(i) * x.get(i);
            sumY2 += y.get(i) * y.get(i);
        }

        double denominator = n * sumX2 - sumX * sumX;
        
        if (Math.abs(denominator) < 1e-10) {
            this.slope = 0.0;
            this.intercept = sumY / n;
            this.r2 = 0.0;
            return;
        }

        this.slope = (n * sumXY - sumX * sumY) / denominator;
        this.intercept = (sumY - this.slope * sumX) / n;

        double ssTot = 0.0;
        double ssRes = 0.0;
        double yMean = sumY / n;

        for (int i = 0; i < n; i++) {
            double predicted = this.slope * x.get(i) + this.intercept;
            ssTot += Math.pow(y.get(i) - yMean, 2);
            ssRes += Math.pow(y.get(i) - predicted, 2);
        }

        this.r2 = (ssTot > 0) ? 1 - (ssRes / ssTot) : 0.0;
    }

    public double predict(double x) {
        return slope * x + intercept;
    }

    public double getSlope() {
        return slope;
    }

    public double getIntercept() {
        return intercept;
    }

    public double getR2() {
        return r2;
    }

    public static class RegressionResult {
        private final double slope;
        private final double intercept;
        private final double r2;

        public RegressionResult(double slope, double intercept, double r2) {
            this.slope = slope;
            this.intercept = intercept;
            this.r2 = r2;
        }

        public double getSlope() {
            return slope;
        }

        public double getIntercept() {
            return intercept;
        }

        public double getR2() {
            return r2;
        }
    }
}
