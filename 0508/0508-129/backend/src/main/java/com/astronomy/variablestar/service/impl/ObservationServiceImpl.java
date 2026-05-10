package com.astronomy.variablestar.service.impl;

import com.astronomy.variablestar.dto.LightCurveDataDTO;
import com.astronomy.variablestar.dto.LightCurveDataDTO.ObservationPoint;
import com.astronomy.variablestar.dto.MagnitudeEstimationResult;
import com.astronomy.variablestar.dto.MagnitudeEstimationResult.ConsistencyLevel;
import com.astronomy.variablestar.dto.ObservationRequestDTO;
import com.astronomy.variablestar.dto.ObservationResponseDTO;
import com.astronomy.variablestar.entity.ObservationRecord;
import com.astronomy.variablestar.entity.ReferenceStar;
import com.astronomy.variablestar.entity.VariableStar;
import com.astronomy.variablestar.repository.ObservationRecordRepository;
import com.astronomy.variablestar.repository.ReferenceStarRepository;
import com.astronomy.variablestar.repository.VariableStarRepository;
import com.astronomy.variablestar.service.ObservationService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ObservationServiceImpl implements ObservationService {

    private static final double JD_2000 = 2451545.0;
    private static final double MJD_OFFSET = 2400000.5;
    
    private static final double CONSISTENCY_THRESHOLD_EXCELLENT = 0.10;
    private static final double CONSISTENCY_THRESHOLD_GOOD = 0.20;
    private static final double CONSISTENCY_THRESHOLD_FAIR = 0.40;
    
    private static final double MAX_RELIABLE_COMPARISON_LIMIT = 1.0;
    private static final double EXCESSIVE_COMPARISON_PENALTY = 0.3;

    private final ObservationRecordRepository observationRecordRepository;
    private final VariableStarRepository variableStarRepository;
    private final ReferenceStarRepository referenceStarRepository;

    @Override
    @Transactional
    @CacheEvict(value = "lightCurve", key = "#request.variableStarId")
    public ObservationResponseDTO createObservation(ObservationRequestDTO request) {
        VariableStar star = variableStarRepository.findById(request.getVariableStarId())
            .orElseThrow(() -> new RuntimeException("变星不存在"));

        ReferenceStar refA = referenceStarRepository.findById(request.getReferenceStarAId())
            .orElseThrow(() -> new RuntimeException("参考星A不存在"));

        ReferenceStar refB = referenceStarRepository.findById(request.getReferenceStarBId())
            .orElseThrow(() -> new RuntimeException("参考星B不存在"));

        MagnitudeEstimationResult estimation = calculateRobustMagnitude(
            refA.getMagnitude(), refB.getMagnitude(),
            request.getComparisonA(), request.getComparisonB(),
            star.getMinMagnitude(), star.getMaxMagnitude()
        );

        double julianDate = calculateJulianDate(request.getObservationTime());
        BigDecimal phase = calculatePhase(
            BigDecimal.valueOf(julianDate),
            star.getPeriodDays(),
            star.getEpochJd()
        );

        ObservationRecord record = new ObservationRecord();
        record.setVariableStarId(request.getVariableStarId());
        record.setObserverName(request.getObserverName());
        record.setObservationTime(request.getObservationTime());
        record.setReferenceStarAId(request.getReferenceStarAId());
        record.setReferenceStarBId(request.getReferenceStarBId());
        record.setComparisonA(request.getComparisonA());
        record.setComparisonB(request.getComparisonB());
        record.setEstimatedMagnitude(estimation.getEstimatedMagnitude());
        record.setMagnitudeError(estimation.getMagnitudeError());
        record.setPhase(phase);
        record.setJulianDate(BigDecimal.valueOf(julianDate));
        record.setObservationMethod(request.getObservationMethod());
        record.setInstrument(request.getInstrument());
        record.setSkyConditions(request.getSkyConditions());
        record.setNotes(request.getNotes());

        ObservationRecord saved = observationRecordRepository.save(record);

        return buildResponseDTO(saved, star, refA, refB, estimation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ObservationResponseDTO> getObservationsByStar(Long starId) {
        List<ObservationRecord> records = 
            observationRecordRepository.findByVariableStarIdOrderByObservationTimeAsc(starId);
        
        VariableStar star = variableStarRepository.findById(starId).orElse(null);
        
        List<ObservationResponseDTO> result = new ArrayList<>();
        for (ObservationRecord record : records) {
            ReferenceStar refA = record.getReferenceStarAId() != null ?
                referenceStarRepository.findById(record.getReferenceStarAId()).orElse(null) : null;
            ReferenceStar refB = record.getReferenceStarBId() != null ?
                referenceStarRepository.findById(record.getReferenceStarBId()).orElse(null) : null;
            result.add(buildResponseDTO(record, star, refA, refB));
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "lightCurve", key = "#starId", 
               condition = "#starId != null", unless = "#result == null")
    public LightCurveDataDTO getLightCurveData(Long starId) {
        VariableStar star = variableStarRepository.findById(starId)
            .orElseThrow(() -> new RuntimeException("变星不存在"));

        List<ObservationRecord> records = 
            observationRecordRepository.findByVariableStarIdForPhasePlot(starId);

        LightCurveDataDTO dto = new LightCurveDataDTO();
        dto.setStarId(starId);
        dto.setStarName(star.getName());
        dto.setStarType(star.getStarType());
        dto.setPeriodDays(star.getPeriodDays());
        dto.setEpochJd(star.getEpochJd());
        dto.setCachedAt(LocalDateTime.now());

        List<ObservationPoint> observations = new ArrayList<>();
        List<ObservationPoint> historicalData = new ArrayList<>();

        int count = 0;
        for (ObservationRecord record : records) {
            ObservationPoint point = new ObservationPoint();
            point.setPhase(record.getPhase());
            point.setMagnitude(record.getEstimatedMagnitude());
            point.setMagnitudeError(record.getMagnitudeError());
            point.setObservationTime(record.getObservationTime());
            point.setJulianDate(record.getJulianDate());
            point.setObserver(record.getObserverName());

            if (count < 5) {
                historicalData.add(point);
            }
            observations.add(point);
            count++;
        }

        dto.setObservations(observations);
        dto.setHistoricalData(historicalData);

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportObservationsToCsv(Long starId) {
        List<ObservationResponseDTO> observations = getObservationsByStar(starId);
        VariableStar star = variableStarRepository.findById(starId).orElse(null);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(
                 new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {

            writer.println('\ufeff');

            if (star != null) {
                writer.println("# 变星: " + star.getName());
                writer.println("# 星座: " + star.getConstellation());
                writer.println("# 类型: " + star.getStarType());
                writer.println("# 周期(天): " + star.getPeriodDays());
                writer.println();
            }

            CSVFormat csvFormat = CSVFormat.Builder.create()
                .setHeader(
                    "观测时间", "儒略日(JD)", "相位",
                    "估算星等", "星等误差",
                    "参考星A", "参考星A星等", "与A比较",
                    "参考星B", "参考星B星等", "与B比较",
                    "观测者", "观测方法", "仪器", "天空条件", "备注"
                )
                .setDelimiter(',')
                .setQuote('"')
                .setRecordSeparator("\r\n")
                .build();

            try (CSVPrinter csvPrinter = new CSVPrinter(writer, csvFormat)) {
                for (ObservationResponseDTO obs : observations) {
                    csvPrinter.printRecord(
                        obs.getObservationTime(),
                        obs.getJulianDate(),
                        obs.getPhase(),
                        obs.getEstimatedMagnitude(),
                        obs.getMagnitudeError(),
                        obs.getReferenceStarAName(),
                        obs.getReferenceStarAMagnitude(),
                        obs.getComparisonA(),
                        obs.getReferenceStarBName(),
                        obs.getReferenceStarBMagnitude(),
                        obs.getComparisonB(),
                        obs.getObserverName(),
                        obs.getObservationMethod(),
                        obs.getInstrument(),
                        obs.getSkyConditions(),
                        obs.getNotes()
                    );
                }
            }

            writer.flush();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("导出CSV失败: " + e.getMessage(), e);
        }
    }

    @Override
    @CacheEvict(value = "lightCurve", key = "#starId")
    public void clearLightCurveCache(Long starId) {
    }

    private MagnitudeEstimationResult calculateRobustMagnitude(
            BigDecimal magA, BigDecimal magB,
            BigDecimal compA, BigDecimal compB,
            BigDecimal starMinMag, BigDecimal starMaxMag) {
        
        double mA = magA.doubleValue();
        double mB = magB.doubleValue();
        double cA = compA.doubleValue();
        double cB = compB.doubleValue();

        double magEstimateA = mA + cA;
        double magEstimateB = mB - cB;
        
        double difference = Math.abs(magEstimateA - magEstimateB);
        
        double weightA = calculateWeight(cA, magEstimateA, starMinMag, starMaxMag);
        double weightB = calculateWeight(cB, magEstimateB, starMinMag, starMaxMag);
        
        double totalWeight = weightA + weightB;
        double normalizedWeightA = weightA / totalWeight;
        double normalizedWeightB = weightB / totalWeight;
        
        double weightedMean = magEstimateA * normalizedWeightA + magEstimateB * normalizedWeightB;
        
        ConsistencyLevel consistency = evaluateConsistency(difference);
        String warningMessage = generateWarningMessage(consistency, difference);
        String suggestion = generateSuggestion(consistency, difference, magEstimateA, magEstimateB, weightA, weightB);
        
        double baseError = calculateBaseError(cA, cB, difference);
        double consistencyPenalty = calculateConsistencyPenalty(difference);
        double rangePenalty = calculateRangePenalty(weightedMean, starMinMag, starMaxMag);
        
        double totalError = Math.min(
            Math.sqrt(baseError * baseError + consistencyPenalty * consistencyPenalty + rangePenalty * rangePenalty),
            0.8
        );

        MagnitudeEstimationResult result = new MagnitudeEstimationResult();
        result.setEstimatedMagnitude(BigDecimal.valueOf(weightedMean).setScale(2, RoundingMode.HALF_UP));
        result.setMagnitudeError(BigDecimal.valueOf(totalError).setScale(2, RoundingMode.HALF_UP));
        result.setEstimateFromA(BigDecimal.valueOf(magEstimateA).setScale(2, RoundingMode.HALF_UP));
        result.setEstimateFromB(BigDecimal.valueOf(magEstimateB).setScale(2, RoundingMode.HALF_UP));
        result.setDifference(BigDecimal.valueOf(difference).setScale(3, RoundingMode.HALF_UP));
        result.setConsistencyLevel(consistency);
        result.setWarningMessage(warningMessage);
        result.setSuggestion(suggestion);
        result.setWeightA(normalizedWeightA);
        result.setWeightB(normalizedWeightB);
        
        return result;
    }

    private double calculateWeight(double comparison, double estimate, BigDecimal starMinMag, BigDecimal starMaxMag) {
        double baseWeight = 1.0;
        
        double absComparison = Math.abs(comparison);
        if (absComparison > MAX_RELIABLE_COMPARISON_LIMIT) {
            double excess = absComparison - MAX_RELIABLE_COMPARISON_LIMIT;
            baseWeight *= Math.exp(-EXCESSIVE_COMPARISON_PENALTY * excess);
        }
        
        if (starMinMag != null && starMaxMag != null) {
            double minMag = starMinMag.doubleValue();
            double maxMag = starMaxMag.doubleValue();
            
            if (estimate < maxMag - 0.3 || estimate > minMag + 0.3) {
                double deviation = 0;
                if (estimate < maxMag - 0.3) {
                    deviation = (maxMag - 0.3) - estimate;
                } else {
                    deviation = estimate - (minMag + 0.3);
                }
                baseWeight *= Math.exp(-0.5 * deviation);
            }
        }
        
        return Math.max(baseWeight, 0.1);
    }

    private ConsistencyLevel evaluateConsistency(double difference) {
        if (difference <= CONSISTENCY_THRESHOLD_EXCELLENT) {
            return ConsistencyLevel.EXCELLENT;
        } else if (difference <= CONSISTENCY_THRESHOLD_GOOD) {
            return ConsistencyLevel.GOOD;
        } else if (difference <= CONSISTENCY_THRESHOLD_FAIR) {
            return ConsistencyLevel.FAIR;
        } else {
            return ConsistencyLevel.POOR;
        }
    }

    private String generateWarningMessage(ConsistencyLevel level, double difference) {
        switch (level) {
            case EXCELLENT:
                return null;
            case GOOD:
                return "两个参考星的估算结果存在轻微差异";
            case FAIR:
                return String.format("估算结果差异为 %.2f 等，可能存在参考星数据问题", difference);
            case POOR:
                return String.format("警告：两个参考星的估算结果差异较大 (%.2f 等)，请检查参考星选择或星等数据", difference);
            default:
                return null;
        }
    }

    private String generateSuggestion(ConsistencyLevel level, double difference, 
                                        double estimateA, double estimateB, 
                                        double weightA, double weightB) {
        if (level == ConsistencyLevel.EXCELLENT || level == ConsistencyLevel.GOOD) {
            return "估算结果一致性良好，可以信任";
        }
        
        StringBuilder sb = new StringBuilder();
        
        if (weightA < weightB * 0.7) {
            sb.append(String.format("基于参考星A的估算 (%.2f) 可信度较低，建议复核与参考星A的比较。", estimateA));
        } else if (weightB < weightA * 0.7) {
            sb.append(String.format("基于参考星B的估算 (%.2f) 可信度较低，建议复核与参考星B的比较。", estimateB));
        }
        
        if (level == ConsistencyLevel.POOR) {
            sb.append(" 建议：1) 检查两颗参考星的星表数据是否准确；2) 重新进行亮度比较；3) 考虑选择其他参考星进行交叉验证。");
        } else if (level == ConsistencyLevel.FAIR) {
            sb.append(" 建议复核观测记录，或增加更多参考星进行验证。");
        }
        
        return sb.toString();
    }

    private double calculateBaseError(double cA, double cB, double difference) {
        double visualError = 0.15;
        double comparisonError = (Math.abs(cA) + Math.abs(cB)) * 0.1;
        return Math.sqrt(visualError * visualError + comparisonError * comparisonError);
    }

    private double calculateConsistencyPenalty(double difference) {
        if (difference <= CONSISTENCY_THRESHOLD_EXCELLENT) {
            return 0;
        } else if (difference <= CONSISTENCY_THRESHOLD_GOOD) {
            return 0.05;
        } else if (difference <= CONSISTENCY_THRESHOLD_FAIR) {
            return 0.15;
        } else {
            return Math.min(0.3 + (difference - CONSISTENCY_THRESHOLD_FAIR) * 0.5, 0.5);
        }
    }

    private double calculateRangePenalty(double estimate, BigDecimal starMinMag, BigDecimal starMaxMag) {
        if (starMinMag == null || starMaxMag == null) {
            return 0;
        }
        
        double minMag = starMinMag.doubleValue();
        double maxMag = starMaxMag.doubleValue();
        
        double penalty = 0;
        
        if (estimate > minMag + 0.5) {
            penalty += (estimate - minMag - 0.5) * 0.3;
        }
        if (estimate < maxMag - 0.5) {
            penalty += (maxMag - 0.5 - estimate) * 0.3;
        }
        
        return Math.max(0, penalty);
    }

    private double calculateJulianDate(LocalDateTime dateTime) {
        long daysSinceEpoch = ChronoUnit.DAYS.between(
            LocalDateTime.of(2000, 1, 1, 12, 0),
            dateTime
        );

        double fractionalDay = (dateTime.getHour() - 12) / 24.0 +
            dateTime.getMinute() / 1440.0 +
            dateTime.getSecond() / 86400.0;

        return JD_2000 + daysSinceEpoch + fractionalDay;
    }

    private BigDecimal calculatePhase(BigDecimal julianDate, 
                                      BigDecimal periodDays,
                                      BigDecimal epochJd) {
        if (periodDays == null || periodDays.doubleValue() == 0) {
            return BigDecimal.ZERO;
        }

        double jd = julianDate.doubleValue();
        double period = periodDays.doubleValue();
        double epoch = epochJd != null ? epochJd.doubleValue() : JD_2000;

        double phase = ((jd - epoch) % period) / period;
        if (phase < 0) phase += 1.0;

        return BigDecimal.valueOf(phase).setScale(4, RoundingMode.HALF_UP);
    }

    private ObservationResponseDTO buildResponseDTO(
            ObservationRecord record,
            VariableStar star,
            ReferenceStar refA,
            ReferenceStar refB) {
        
        return buildResponseDTO(record, star, refA, refB, null);
    }

    private ObservationResponseDTO buildResponseDTO(
            ObservationRecord record,
            VariableStar star,
            ReferenceStar refA,
            ReferenceStar refB,
            MagnitudeEstimationResult estimation) {
        
        ObservationResponseDTO dto = new ObservationResponseDTO();
        dto.setId(record.getId());
        dto.setVariableStarId(record.getVariableStarId());
        dto.setStarName(star != null ? star.getName() : null);
        dto.setObserverName(record.getObserverName());
        dto.setObservationTime(record.getObservationTime());
        dto.setEstimatedMagnitude(record.getEstimatedMagnitude());
        dto.setMagnitudeError(record.getMagnitudeError());
        dto.setPhase(record.getPhase());
        dto.setJulianDate(record.getJulianDate());
        dto.setObservationMethod(record.getObservationMethod());
        dto.setInstrument(record.getInstrument());
        dto.setSkyConditions(record.getSkyConditions());
        dto.setNotes(record.getNotes());
        dto.setCreatedAt(record.getCreatedAt());

        if (refA != null) {
            dto.setReferenceStarAName(refA.getName());
            dto.setReferenceStarAMagnitude(refA.getMagnitude());
        }
        dto.setComparisonA(record.getComparisonA());

        if (refB != null) {
            dto.setReferenceStarBName(refB.getName());
            dto.setReferenceStarBMagnitude(refB.getMagnitude());
        }
        dto.setComparisonB(record.getComparisonB());

        if (estimation != null) {
            dto.setEstimateFromA(estimation.getEstimateFromA());
            dto.setEstimateFromB(estimation.getEstimateFromB());
            dto.setEstimateDifference(estimation.getDifference());
            dto.setConsistencyLevel(estimation.getConsistencyLevel() != null ? 
                estimation.getConsistencyLevel().getLabel() : null);
            dto.setConsistencyDescription(estimation.getConsistencyLevel() != null ? 
                estimation.getConsistencyLevel().getDescription() : null);
            dto.setWarningMessage(estimation.getWarningMessage());
            dto.setSuggestion(estimation.getSuggestion());
        }

        return dto;
    }
}
