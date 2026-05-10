package com.meteor.util;

import com.meteor.dto.RadiantPointResult;
import com.meteor.entity.MeteorRecord;
import org.apache.commons.math3.fitting.leastsquares.*;
import org.apache.commons.math3.linear.Array2DRowRealMatrix;
import org.apache.commons.math3.linear.ArrayRealVector;
import org.apache.commons.math3.linear.RealMatrix;
import org.apache.commons.math3.linear.RealVector;
import org.apache.commons.math3.util.Pair;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class RadiantPointCalculator {

    private static final int MIN_RECORDS_FOR_CALCULATION = 3;
    private static final double EPSILON = 1e-10;

    public static Optional<RadiantPointResult> calculateRadiantPoint(List<MeteorRecord> records) {
        if (records == null || records.size() < MIN_RECORDS_FOR_CALCULATION) {
            return Optional.empty();
        }

        List<MeteorRecord> validRecords = records.stream()
                .filter(r -> isValidDouble(r.getTrajectoryStartRA()) 
                        && isValidDouble(r.getTrajectoryStartDec())
                        && isValidDouble(r.getTrajectoryEndRA()) 
                        && isValidDouble(r.getTrajectoryEndDec()))
                .filter(r -> !isSamePoint(
                        r.getTrajectoryStartRA(), r.getTrajectoryStartDec(),
                        r.getTrajectoryEndRA(), r.getTrajectoryEndDec()))
                .collect(java.util.stream.Collectors.toList());

        if (validRecords.size() < MIN_RECORDS_FOR_CALCULATION) {
            return Optional.empty();
        }

        try {
            double[] initialGuess = estimateInitialRadiant(validRecords);
            
            if (!isValidDouble(initialGuess[0]) || !isValidDouble(initialGuess[1])) {
                return calculateSimpleIntersection(validRecords);
            }

            LeastSquaresProblem problem = new LeastSquaresBuilder()
                    .start(initialGuess)
                    .model(new MultivariateJacobianFunction() {
                        @Override
                        public Pair<RealVector, RealMatrix> value(RealVector point) {
                            double ra = point.getEntry(0);
                            double dec = point.getEntry(1);

                            double[] residuals = new double[validRecords.size() * 2];
                            double[][] jacobian = new double[validRecords.size() * 2][2];

                            for (int i = 0; i < validRecords.size(); i++) {
                                MeteorRecord r = validRecords.get(i);

                                residuals[2 * i] = safeDistanceToLine(
                                        ra, dec,
                                        r.getTrajectoryStartRA(), r.getTrajectoryStartDec(),
                                        r.getTrajectoryEndRA(), r.getTrajectoryEndDec()
                                );
                                residuals[2 * i + 1] = safeAngularResidual(
                                        ra, dec,
                                        r.getTrajectoryStartRA(), r.getTrajectoryStartDec(),
                                        r.getTrajectoryEndRA(), r.getTrajectoryEndDec()
                                );

                                double[] grad = safeDistanceGradient(
                                        ra, dec,
                                        r.getTrajectoryStartRA(), r.getTrajectoryStartDec(),
                                        r.getTrajectoryEndRA(), r.getTrajectoryEndDec()
                                );
                                jacobian[2 * i][0] = safeValue(grad[0]);
                                jacobian[2 * i][1] = safeValue(grad[1]);
                                jacobian[2 * i + 1][0] = safeValue(grad[0] * 0.5);
                                jacobian[2 * i + 1][1] = safeValue(grad[1] * 0.5);
                            }

                            return new Pair<>(
                                    new ArrayRealVector(residuals),
                                    new Array2DRowRealMatrix(jacobian)
                            );
                        }
                    })
                    .target(new double[validRecords.size() * 2])
                    .maxIterations(1000)
                    .maxEvaluations(10000)
                    .build();

            LeastSquaresOptimizer optimizer = new LevenbergMarquardtOptimizer();
            LeastSquaresOptimizer.Optimum optimum = optimizer.optimize(problem);

            RealVector solution = optimum.getPoint();
            double ra = normalizeRA(safeValue(solution.getEntry(0)));
            double dec = clampDec(safeValue(solution.getEntry(1)));

            if (!isValidDouble(ra) || !isValidDouble(dec)) {
                return calculateSimpleIntersection(validRecords);
            }

            double rms = optimum.getRMS();
            double confidence = calculateConfidence(rms, validRecords.size());

            RadiantPointResult result = new RadiantPointResult();
            result.setRa(ra);
            result.setDec(dec);
            result.setConstellation(ConstellationMapper.getConstellation(ra, dec));
            result.setConfidence(confidence);
            result.setRecordCount(validRecords.size());

            return Optional.of(result);

        } catch (Exception e) {
            return calculateSimpleIntersection(validRecords);
        }
    }

    private static double[] estimateInitialRadiant(List<MeteorRecord> records) {
        double sumRA = 0;
        double sumDec = 0;
        int count = 0;

        for (int i = 0; i < records.size(); i++) {
            for (int j = i + 1; j < records.size(); j++) {
                MeteorRecord r1 = records.get(i);
                MeteorRecord r2 = records.get(j);

                double[] intersection = lineIntersection(
                        r1.getTrajectoryStartRA(), r1.getTrajectoryStartDec(),
                        r1.getTrajectoryEndRA(), r1.getTrajectoryEndDec(),
                        r2.getTrajectoryStartRA(), r2.getTrajectoryStartDec(),
                        r2.getTrajectoryEndRA(), r2.getTrajectoryEndDec()
                );

                if (intersection != null 
                        && isValidDouble(intersection[0]) 
                        && isValidDouble(intersection[1])) {
                    sumRA += intersection[0];
                    sumDec += intersection[1];
                    count++;
                }
            }
        }

        if (count > 0) {
            double avgRA = sumRA / count;
            double avgDec = sumDec / count;
            if (isValidDouble(avgRA) && isValidDouble(avgDec)) {
                return new double[]{avgRA, avgDec};
            }
        }

        MeteorRecord first = records.get(0);
        return new double[]{
                safeValue((first.getTrajectoryStartRA() + first.getTrajectoryEndRA()) / 2),
                safeValue((first.getTrajectoryStartDec() + first.getTrajectoryEndDec()) / 2)
        };
    }

    private static double[] lineIntersection(
            double x1, double y1, double x2, double y2,
            double x3, double y3, double x4, double y4) {

        if (!isValidDouble(x1) || !isValidDouble(y1) || !isValidDouble(x2) || !isValidDouble(y2)
                || !isValidDouble(x3) || !isValidDouble(y3) || !isValidDouble(x4) || !isValidDouble(y4)) {
            return null;
        }

        double denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < EPSILON) {
            return null;
        }

        double t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        double s = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        if (!isValidDouble(t) || !isValidDouble(s)) {
            return null;
        }

        if (t < 0 || s < 0) {
            double x = x1 + t * (x2 - x1);
            double y = y1 + t * (y2 - y1);
            
            if (!isValidDouble(x) || !isValidDouble(y)) {
                return null;
            }
            
            return new double[]{x, y};
        }

        return null;
    }

    private static double safeDistanceToLine(
            double px, double py,
            double x1, double y1, double x2, double y2) {
        
        if (!isValidDouble(px) || !isValidDouble(py) 
                || !isValidDouble(x1) || !isValidDouble(y1) 
                || !isValidDouble(x2) || !isValidDouble(y2)) {
            return 0;
        }

        try {
            return distanceToLine(px, py, x1, y1, x2, y2);
        } catch (Exception e) {
            return 0;
        }
    }

    private static double distanceToLine(
            double px, double py,
            double x1, double y1, double x2, double y2) {

        double A = px - x1;
        double B = py - y1;
        double C = x2 - x1;
        double D = y2 - y1;

        double dot = A * C + B * D;
        double lenSq = C * C + D * D;
        double param = Math.abs(lenSq) > EPSILON ? dot / lenSq : -1;

        double xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        double dx = px - xx;
        double dy = py - yy;

        double sinDy2 = Math.sin(Math.toRadians(dy) / 2);
        sinDy2 = sinDy2 * sinDy2;

        double sinDx2 = Math.sin(Math.toRadians(dx) / 2);
        sinDx2 = sinDx2 * sinDx2;

        double cosPy = Math.cos(Math.toRadians(py));
        double cosYy = Math.cos(Math.toRadians(yy));

        double arg = sinDy2 + cosPy * cosYy * sinDx2;
        arg = Math.max(0.0, Math.min(1.0, arg));

        double angDist = 2 * Math.asin(Math.sqrt(arg));

        return Math.toDegrees(angDist);
    }

    private static double[] safeDistanceGradient(
            double px, double py,
            double x1, double y1, double x2, double y2) {
        
        try {
            return distanceGradient(px, py, x1, y1, x2, y2);
        } catch (Exception e) {
            return new double[]{0, 0};
        }
    }

    private static double[] distanceGradient(
            double px, double py,
            double x1, double y1, double x2, double y2) {

        double h = 0.01;
        double d0 = distanceToLine(px, py, x1, y1, x2, y2);
        double dRA = distanceToLine(px + h, py, x1, y1, x2, y2);
        double dDec = distanceToLine(px, py + h, x1, y1, x2, y2);

        double gradRA = (dRA - d0) / h;
        double gradDec = (dDec - d0) / h;

        return new double[]{safeValue(gradRA), safeValue(gradDec)};
    }

    private static double safeAngularResidual(
            double ra, double dec,
            double startRA, double startDec,
            double endRA, double endDec) {
        
        if (!isValidDouble(ra) || !isValidDouble(dec)
                || !isValidDouble(startRA) || !isValidDouble(startDec)
                || !isValidDouble(endRA) || !isValidDouble(endDec)) {
            return 0;
        }

        try {
            return angularResidual(ra, dec, startRA, startDec, endRA, endDec);
        } catch (Exception e) {
            return 0;
        }
    }

    private static double angularResidual(
            double ra, double dec,
            double startRA, double startDec,
            double endRA, double endDec) {

        double dir1RA = endRA - startRA;
        double dir1Dec = endDec - startDec;
        double dir2RA = startRA - ra;
        double dir2Dec = startDec - dec;

        double len1 = Math.sqrt(dir1RA * dir1RA + dir1Dec * dir1Dec);
        double len2 = Math.sqrt(dir2RA * dir2RA + dir2Dec * dir2Dec);

        if (len1 < EPSILON || len2 < EPSILON) {
            return 0;
        }

        double dot = (dir1RA * dir2RA + dir1Dec * dir2Dec) / (len1 * len2);
        dot = Math.max(-1.0, Math.min(1.0, dot));

        return Math.acos(dot);
    }

    private static double calculateConfidence(double rms, int recordCount) {
        if (!isValidDouble(rms) || rms < 0) {
            return 0.5;
        }
        
        double normalizedRMS = Math.min(rms / 30.0, 1.0);
        double recordFactor = Math.min(recordCount / 10.0, 1.0);

        double confidence = (1 - normalizedRMS) * (0.5 + 0.5 * recordFactor);
        return Math.max(0, Math.min(1, confidence));
    }

    private static Optional<RadiantPointResult> calculateSimpleIntersection(List<MeteorRecord> records) {
        List<double[]> intersections = new ArrayList<>();

        for (int i = 0; i < records.size(); i++) {
            for (int j = i + 1; j < records.size(); j++) {
                MeteorRecord r1 = records.get(i);
                MeteorRecord r2 = records.get(j);

                double[] intersection = lineIntersection(
                        r1.getTrajectoryStartRA(), r1.getTrajectoryStartDec(),
                        r1.getTrajectoryEndRA(), r1.getTrajectoryEndDec(),
                        r2.getTrajectoryStartRA(), r2.getTrajectoryStartDec(),
                        r2.getTrajectoryEndRA(), r2.getTrajectoryEndDec()
                );

                if (intersection != null 
                        && isValidDouble(intersection[0]) 
                        && isValidDouble(intersection[1])) {
                    intersections.add(intersection);
                }
            }
        }

        if (intersections.size() < 1) {
            return Optional.empty();
        }

        double sumRA = 0, sumDec = 0;
        int validCount = 0;
        for (double[] pt : intersections) {
            if (isValidDouble(pt[0]) && isValidDouble(pt[1])) {
                sumRA += pt[0];
                sumDec += pt[1];
                validCount++;
            }
        }

        if (validCount < 1) {
            return Optional.empty();
        }

        double avgRA = normalizeRA(safeValue(sumRA / validCount));
        double avgDec = clampDec(safeValue(sumDec / validCount));

        if (!isValidDouble(avgRA) || !isValidDouble(avgDec)) {
            return Optional.empty();
        }

        RadiantPointResult result = new RadiantPointResult();
        result.setRa(avgRA);
        result.setDec(avgDec);
        result.setConstellation(ConstellationMapper.getConstellation(avgRA, avgDec));
        result.setConfidence(0.3 + 0.2 * Math.min(validCount / 5.0, 1.0));
        result.setRecordCount(records.size());

        return Optional.of(result);
    }

    private static double normalizeRA(double ra) {
        if (!isValidDouble(ra)) {
            return 180.0;
        }
        
        while (ra < 0) ra += 360;
        while (ra >= 360) ra -= 360;
        return ra;
    }

    private static double clampDec(double dec) {
        if (!isValidDouble(dec)) {
            return 0.0;
        }
        return Math.max(-90, Math.min(90, dec));
    }

    private static boolean isSamePoint(double ra1, double dec1, double ra2, double dec2) {
        if (!isValidDouble(ra1) || !isValidDouble(dec1) 
                || !isValidDouble(ra2) || !isValidDouble(dec2)) {
            return true;
        }
        
        double dRA = Math.abs(ra1 - ra2);
        if (dRA > 180) dRA = 360 - dRA;
        double dDec = Math.abs(dec1 - dec2);
        return dRA < 0.1 && dDec < 0.1;
    }

    private static boolean isValidDouble(double value) {
        return !Double.isNaN(value) && !Double.isInfinite(value);
    }

    private static double safeValue(double value) {
        if (!isValidDouble(value)) {
            return 0.0;
        }
        return value;
    }
}
