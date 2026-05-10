package com.astronomy.variablestar.service.impl;

import com.astronomy.variablestar.algorithm.ConvolutionSmoother;
import com.astronomy.variablestar.algorithm.ConvolutionSmoother.SmoothMethod;
import com.astronomy.variablestar.algorithm.ConvolutionSmoother.SmoothResult;
import com.astronomy.variablestar.algorithm.LombScarglePeriodogram;
import com.astronomy.variablestar.algorithm.LombScarglePeriodogram.PeriodogramResult;
import com.astronomy.variablestar.algorithm.LombScarglePeriodogram.PeriodResult;
import com.astronomy.variablestar.dto.PeriodDetectionRequestDTO;
import com.astronomy.variablestar.dto.PeriodDetectionRequestDTO.ObservationPoint;
import com.astronomy.variablestar.dto.PeriodDetectionResultDTO;
import com.astronomy.variablestar.dto.PeriodDetectionResultDTO.CandidatePeriod;
import com.astronomy.variablestar.dto.PeriodDetectionResultDTO.PeriodogramPoint;
import com.astronomy.variablestar.dto.PeriodDetectionResultDTO.SmoothedLightCurve;
import com.astronomy.variablestar.entity.ObservationRecord;
import com.astronomy.variablestar.entity.VariableStar;
import com.astronomy.variablestar.repository.ObservationRecordRepository;
import com.astronomy.variablestar.repository.VariableStarRepository;
import com.astronomy.variablestar.service.PeriodDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PeriodDetectionServiceImpl implements PeriodDetectionService {

    private static final double JD_2000 = 2451545.0;
    private static final double FAP_SIGNIFICANCE_THRESHOLD = 0.01;

    private final ObservationRecordRepository observationRecordRepository;
    private final VariableStarRepository variableStarRepository;

    @Override
    public PeriodDetectionResultDTO detectPeriod(PeriodDetectionRequestDTO request) {
        List<Double> times;
        List<Double> values;
        List<Double> errors;
        String starName = null;
        Long starId = null;
        VariableStar star = null;

        if (request.getStarId() != null && (request.getObservations() == null || request.getObservations().isEmpty())) {
            List<ObservationRecord> records = 
                observationRecordRepository.findByVariableStarIdOrderByObservationTimeAsc(request.getStarId());
            
            if (records.size() < 5) {
                PeriodDetectionResultDTO result = new PeriodDetectionResultDTO();
                result.setSuccess(false);
                result.setMessage("该变星的观测数据不足，至少需要5个观测点才能进行周期检测。当前有 " + records.size() + " 个观测点。");
                return result;
            }

            star = variableStarRepository.findById(request.getStarId()).orElse(null);
            starName = star != null ? star.getName() : null;
            starId = request.getStarId();

            times = new ArrayList<>();
            values = new ArrayList<>();
            errors = new ArrayList<>();

            for (ObservationRecord record : records) {
                if (record.getJulianDate() != null) {
                    times.add(record.getJulianDate().doubleValue());
                } else {
                    times.add(calculateJulianDate(record.getObservationTime()));
                }
                values.add(record.getEstimatedMagnitude().doubleValue());
                errors.add(record.getMagnitudeError() != null ? record.getMagnitudeError().doubleValue() : 0.15);
            }
        } else if (request.getObservations() != null && !request.getObservations().isEmpty()) {
            times = new ArrayList<>();
            values = new ArrayList<>();
            errors = new ArrayList<>();

            for (ObservationPoint point : request.getObservations()) {
                if (point.getJulianDate() != null) {
                    times.add(point.getJulianDate());
                } else if (point.getObservationTime() != null) {
                    times.add(parseJulianDate(point.getObservationTime()));
                }
                values.add(point.getMagnitude());
                errors.add(point.getMagnitudeError() != null ? point.getMagnitudeError() : 0.15);
            }

            if (request.getStarId() != null) {
                star = variableStarRepository.findById(request.getStarId()).orElse(null);
                starName = star != null ? star.getName() : null;
                starId = request.getStarId();
            }
        } else {
            PeriodDetectionResultDTO result = new PeriodDetectionResultDTO();
            result.setSuccess(false);
            result.setMessage("请提供变星ID或观测数据");
            return result;
        }

        if (times.size() < 5) {
            PeriodDetectionResultDTO result = new PeriodDetectionResultDTO();
            result.setSuccess(false);
            result.setMessage("观测数据不足，至少需要5个观测点才能进行周期检测");
            return result;
        }

        double[] timeArray = times.stream().mapToDouble(Double::doubleValue).toArray();
        double[] valueArray = values.stream().mapToDouble(Double::doubleValue).toArray();
        double[] errorArray = errors.stream().mapToDouble(Double::doubleValue).toArray();

        double minTime = Double.MAX_VALUE;
        double maxTime = Double.MIN_VALUE;
        for (double t : timeArray) {
            minTime = Math.min(minTime, t);
            maxTime = Math.max(maxTime, t);
        }
        double timeSpan = maxTime - minTime;

        PeriodDetectionResultDTO result = new PeriodDetectionResultDTO();
        result.setSuccess(true);
        result.setDataPoints(times.size());
        result.setTimeSpan(timeSpan);
        result.setStarName(starName);
        result.setStarId(starId);

        double periodToUse;
        double epochToUse;

        if (Boolean.TRUE.equals(request.getUseCustomPeriod()) && request.getCustomPeriod() != null) {
            periodToUse = request.getCustomPeriod();
            epochToUse = request.getCustomEpoch() != null ? request.getCustomEpoch() : 
                        (star != null && star.getEpochJd() != null ? star.getEpochJd().doubleValue() : minTime);
            result.setMessage("使用自定义周期进行折叠: " + periodToUse + " 天");
        } else {
            try {
                PeriodogramResult lsResult = LombScarglePeriodogram.compute(timeArray, valueArray, errorArray);
                
                if (lsResult.getPeaks() == null || lsResult.getPeaks().isEmpty()) {
                    result.setSuccess(false);
                    result.setMessage("未能检测到显著的周期信号");
                    return result;
                }

                PeriodResult bestPeak = lsResult.getPeaks().get(0);
                periodToUse = bestPeak.getPeriod();
                epochToUse = minTime;

                result.setBestPeriod(bestPeak.getPeriod());
                result.setBestFrequency(bestPeak.getFrequency());
                result.setBestPower(bestPeak.getPower());
                result.setFalseAlarmProbability(lsResult.getFalseAlarmProbability());
                result.setSignificant(lsResult.getFalseAlarmProbability() < FAP_SIGNIFICANCE_THRESHOLD);

                List<CandidatePeriod> candidates = new ArrayList<>();
                for (int i = 0; i < Math.min(5, lsResult.getPeaks().size()); i++) {
                    PeriodResult peak = lsResult.getPeaks().get(i);
                    CandidatePeriod cp = new CandidatePeriod();
                    cp.setPeriod(peak.getPeriod());
                    cp.setFrequency(peak.getFrequency());
                    cp.setPower(peak.getPower());
                    cp.setRank(i + 1);
                    
                    if (i == 0) {
                        cp.setPeriodType("主周期");
                    } else if (Math.abs(peak.getPeriod() - periodToUse / 2) < periodToUse * 0.1) {
                        cp.setPeriodType("半周期谐波");
                    } else if (Math.abs(peak.getPeriod() - periodToUse * 2) < periodToUse * 0.2) {
                        cp.setPeriodType("倍周期谐波");
                    } else {
                        cp.setPeriodType("候选周期");
                    }
                    candidates.add(cp);
                }
                result.setCandidatePeriods(candidates);

                List<PeriodogramPoint> periodogramPoints = new ArrayList<>();
                double[] freqs = lsResult.getFrequencies();
                double[] powers = lsResult.getPowers();
                int step = Math.max(1, freqs.length / 500);
                
                for (int i = 0; i < freqs.length; i += step) {
                    PeriodogramPoint pp = new PeriodogramPoint();
                    pp.setFrequency(freqs[i]);
                    pp.setPeriod(1.0 / freqs[i]);
                    pp.setPower(powers[i]);
                    periodogramPoints.add(pp);
                }
                result.setPeriodogramData(periodogramPoints);

            } catch (Exception e) {
                result.setSuccess(false);
                result.setMessage("周期检测失败: " + e.getMessage());
                return result;
            }
        }

        String smoothMethodStr = request.getSmoothMethod() != null ? request.getSmoothMethod() : "SAVITZKY_GOLAY";
        SmoothMethod smoothMethod = SmoothMethod.valueOf(smoothMethodStr);
        int windowSize = request.getWindowSize() != null ? request.getWindowSize() : 7;
        int phaseBins = request.getPhaseBins() != null ? request.getPhaseBins() : 50;

        try {
            SmoothResult smoothResult = ConvolutionSmoother.phaseFoldAndSmooth(
                timeArray, valueArray, errorArray,
                periodToUse, epochToUse,
                smoothMethod, windowSize, phaseBins
            );

            SmoothedLightCurve smoothed = new SmoothedLightCurve();
            smoothed.setMethod(smoothMethod.getLabel());
            smoothed.setWindowSize(windowSize);
            smoothed.setRms(smoothResult.getRms());
            smoothed.setChiSquare(smoothResult.getChiSquare());

            if (smoothResult.getSmoothedPhases() != null) {
                smoothed.setPhases(convertToList(smoothResult.getSmoothedPhases()));
                smoothed.setSmoothedMagnitudes(convertToList(smoothResult.getSmoothedValues()));
                smoothed.setOriginalMagnitudes(convertToList(smoothResult.getOriginalValues()));
                smoothed.setResiduals(convertToList(smoothResult.getResiduals()));
            }

            result.setSmoothedLightCurve(smoothed);

        } catch (Exception e) {
            result.setMessage(result.getMessage() + " (平滑处理失败: " + e.getMessage() + ")");
        }

        return result;
    }

    @Override
    public PeriodDetectionResultDTO detectPeriodForStar(Long starId) {
        PeriodDetectionRequestDTO request = new PeriodDetectionRequestDTO();
        request.setStarId(starId);
        request.setSmoothMethod("SAVITZKY_GOLAY");
        request.setWindowSize(7);
        request.setPhaseBins(50);
        return detectPeriod(request);
    }

    private List<Double> convertToList(double[] array) {
        if (array == null) return null;
        List<Double> list = new ArrayList<>();
        for (double d : array) {
            list.add(d);
        }
        return list;
    }

    private double calculateJulianDate(LocalDateTime dateTime) {
        if (dateTime == null) return JD_2000;
        
        long daysSinceEpoch = ChronoUnit.DAYS.between(
            LocalDateTime.of(2000, 1, 1, 12, 0),
            dateTime
        );

        double fractionalDay = (dateTime.getHour() - 12) / 24.0 +
            dateTime.getMinute() / 1440.0 +
            dateTime.getSecond() / 86400.0;

        return JD_2000 + daysSinceEpoch + fractionalDay;
    }

    private double parseJulianDate(String dateTimeStr) {
        try {
            return Double.parseDouble(dateTimeStr);
        } catch (NumberFormatException e) {
            return JD_2000;
        }
    }
}
