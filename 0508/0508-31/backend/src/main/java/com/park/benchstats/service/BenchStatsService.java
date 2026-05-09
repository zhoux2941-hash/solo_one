package com.park.benchstats.service;

import com.park.benchstats.entity.Bench;
import com.park.benchstats.entity.BenchDailyStats;
import com.park.benchstats.enums.WeatherType;
import com.park.benchstats.repository.BenchDailyStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class BenchStatsService {
    private final BenchDailyStatsRepository statsRepository;
    private final BenchService benchService;
    private final Random random = new Random();

    public int generateBaseSunDurationMinutes(Bench bench) {
        int baseSunMinutes;
        if ("东区".equals(bench.getArea())) {
            baseSunMinutes = 360 + random.nextInt(120);
        } else {
            baseSunMinutes = 240 + random.nextInt(90);
        }

        if ("朝东".equals(bench.getOrientation())) {
            baseSunMinutes = (int) (baseSunMinutes * 1.15);
        } else if ("朝西".equals(bench.getOrientation())) {
            baseSunMinutes = (int) (baseSunMinutes * 0.85);
        }

        int maxSun = BenchDailyStats.TOTAL_DAYLIGHT_MINUTES - 30;
        return Math.max(60, Math.min(maxSun, baseSunMinutes));
    }

    public int applyWeatherFactor(int baseSunMinutes, WeatherType weather) {
        if (weather == null) {
            weather = WeatherType.SUNNY;
        }
        
        double factor = weather.getSunFactor();
        int adjusted = (int) (baseSunMinutes * factor);
        
        int maxSun = BenchDailyStats.TOTAL_DAYLIGHT_MINUTES - 30;
        return Math.max(30, Math.min(maxSun, adjusted));
    }

    public BenchDailyStats generateMockStats(Bench bench, LocalDate date) {
        int sunDuration = generateBaseSunDurationMinutes(bench);
        
        BenchDailyStats stats = new BenchDailyStats();
        stats.setBenchId(bench.getId());
        stats.setStatDate(date);
        stats.setSunDurationMinutes(sunDuration);
        stats.setTotalDaylightMinutes(BenchDailyStats.TOTAL_DAYLIGHT_MINUTES);
        
        log.debug("Generated base stats for bench {}: sunDuration={}min", 
                bench.getBenchCode(), sunDuration);
        
        return stats;
    }

    public List<BenchDailyStats> getOrGenerateTodayStats() {
        LocalDate today = LocalDate.now();
        return getStatsByDate(today);
    }

    public List<BenchDailyStats> getStatsByDate(LocalDate date) {
        List<Bench> benches = benchService.getAllBenches();
        List<BenchDailyStats> result = new ArrayList<>();

        for (Bench bench : benches) {
            Optional<BenchDailyStats> existing = statsRepository.findByBenchIdAndStatDate(bench.getId(), date);
            if (existing.isPresent()) {
                result.add(existing.get());
            } else {
                BenchDailyStats stats = generateMockStats(bench, date);
                statsRepository.save(stats);
                result.add(stats);
            }
        }

        return result;
    }
}
