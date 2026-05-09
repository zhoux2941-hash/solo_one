package com.carwash.monitor.service;

import com.carwash.monitor.config.FoamConfig;
import com.carwash.monitor.dto.AbnormalStatsDTO;
import com.carwash.monitor.entity.FoamConcentration;
import com.carwash.monitor.repository.FoamConcentrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FoamConcentrationService {

    private final FoamConcentrationRepository repository;
    private final FoamConfig foamConfig;

    private static final List<String> MACHINES = Arrays.asList("C1", "C2", "C3", "C4");
    private final Random random = new Random();

    @Transactional
    public FoamConcentration save(FoamConcentration entity) {
        return repository.save(entity);
    }

    @Transactional
    public List<FoamConcentration> saveAll(List<FoamConcentration> entities) {
        return repository.saveAll(entities);
    }

    public List<FoamConcentration> findByConditions(String machineId, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = LocalDateTime.now();
        if (startTime == null) {
            startTime = now.minusHours(24);
        }
        if (endTime == null) {
            endTime = now;
        }

        List<FoamConcentration> results = repository.findByConditions(machineId, startTime, endTime);
        results.forEach(this::markAbnormal);
        return results;
    }

    public Map<String, List<FoamConcentration>> getLast24HoursGrouped() {
        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(24);

        List<FoamConcentration> allRecords = repository.findByRecordTimeBetweenOrderByRecordTimeAsc(startTime, endTime);
        allRecords.forEach(this::markAbnormal);

        return allRecords.stream()
                .collect(Collectors.groupingBy(
                        FoamConcentration::getMachineId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    public List<AbnormalStatsDTO> getAbnormalStats(LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = LocalDateTime.now();
        if (startTime == null) {
            startTime = now.minusHours(24);
        }
        if (endTime == null) {
            endTime = now;
        }

        List<Object[]> totalRecords = repository.countTotalRecordsByTimeRangeNative(startTime, endTime);
        Map<String, Long> totalMap = new HashMap<>();
        for (Object[] row : totalRecords) {
            String machineId = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            totalMap.put(machineId, count);
        }

        List<Object[]> abnormalRecords = repository.countAbnormalByTimeRange(
                foamConfig.getMinNormal(),
                foamConfig.getMaxNormal(),
                startTime,
                endTime
        );
        Map<String, AbnormalAggResult> abnormalMap = new HashMap<>();
        for (Object[] row : abnormalRecords) {
            String machineId = (String) row[0];
            Long abnormalCount = ((Number) row[1]).longValue();
            Long overLimitCount = ((Number) row[2]).longValue();
            Long underLimitCount = ((Number) row[3]).longValue();
            abnormalMap.put(machineId, new AbnormalAggResult(abnormalCount, overLimitCount, underLimitCount));
        }

        List<AbnormalStatsDTO> stats = new ArrayList<>();
        for (String machineId : MACHINES) {
            long total = totalMap.getOrDefault(machineId, 0L);
            AbnormalAggResult agg = abnormalMap.getOrDefault(machineId, new AbnormalAggResult(0L, 0L, 0L));

            double rate = total > 0 ? (agg.abnormalCount * 100.0 / total) : 0.0;

            stats.add(AbnormalStatsDTO.builder()
                    .machineId(machineId)
                    .totalRecords(total)
                    .abnormalCount(agg.abnormalCount)
                    .overLimitCount(agg.overLimitCount)
                    .underLimitCount(agg.underLimitCount)
                    .abnormalRate(Math.round(rate * 100.0) / 100.0)
                    .build());
        }

        return stats;
    }

    private static class AbnormalAggResult {
        final long abnormalCount;
        final long overLimitCount;
        final long underLimitCount;

        AbnormalAggResult(long abnormalCount, long overLimitCount, long underLimitCount) {
            this.abnormalCount = abnormalCount;
            this.overLimitCount = overLimitCount;
            this.underLimitCount = underLimitCount;
        }
    }

    @Transactional
    public void generateMockData() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = now.minusHours(24);

        List<FoamConcentration> mockData = new ArrayList<>();

        for (String machineId : MACHINES) {
            LocalDateTime currentTime = startTime;

            while (currentTime.isBefore(now) || currentTime.isEqual(now)) {
                double concentration = generateConcentration(machineId);

                mockData.add(FoamConcentration.builder()
                        .machineId(machineId)
                        .concentration(concentration)
                        .recordTime(currentTime)
                        .build());

                currentTime = currentTime.plusHours(1);
            }
        }

        repository.saveAll(mockData);
        log.info("Generated {} mock data records for past 24 hours", mockData.size());
    }

    private double generateConcentration(String machineId) {
        double baseMin = foamConfig.getMinNormal();
        double baseMax = foamConfig.getMaxNormal();

        if ("C3".equals(machineId)) {
            double abnormalChance = 0.45;
            if (random.nextDouble() < abnormalChance) {
                boolean overLimit = random.nextBoolean();
                if (overLimit) {
                    return Math.round((baseMax + 0.5 + random.nextDouble() * 3.0) * 100.0) / 100.0;
                } else {
                    return Math.round((Math.max(0.1, baseMin - 0.5 - random.nextDouble() * 1.5)) * 100.0) / 100.0;
                }
            } else {
                return Math.round((baseMin + random.nextDouble() * (baseMax - baseMin)) * 100.0) / 100.0;
            }
        } else {
            double normalChance = 0.92;
            if (random.nextDouble() < normalChance) {
                return Math.round((baseMin + random.nextDouble() * (baseMax - baseMin)) * 100.0) / 100.0;
            } else {
                boolean overLimit = random.nextBoolean();
                if (overLimit) {
                    return Math.round((baseMax + 0.3 + random.nextDouble() * 1.5) * 100.0) / 100.0;
                } else {
                    return Math.round((Math.max(0.5, baseMin - 0.3 - random.nextDouble() * 1.0)) * 100.0) / 100.0;
                }
            }
        }
    }

    private void markAbnormal(FoamConcentration record) {
        double concentration = record.getConcentration();
        boolean isAbnormal = concentration < foamConfig.getMinNormal()
                || concentration > foamConfig.getMaxNormal();
        record.setAbnormal(isAbnormal);
    }
}
