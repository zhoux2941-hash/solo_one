package com.park.benchstats.controller;

import com.park.benchstats.dto.BenchStatsVO;
import com.park.benchstats.entity.Bench;
import com.park.benchstats.entity.BenchDailyStats;
import com.park.benchstats.enums.WeatherType;
import com.park.benchstats.service.BenchService;
import com.park.benchstats.service.BenchStatsService;
import com.park.benchstats.service.WeatherCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/benches")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class BenchStatsController {
    private final BenchService benchService;
    private final BenchStatsService statsService;
    private final WeatherCacheService weatherCacheService;

    @GetMapping
    public ResponseEntity<List<Bench>> getAllBenches() {
        return ResponseEntity.ok(benchService.getAllBenches());
    }

    @GetMapping("/weather/types")
    public ResponseEntity<List<Map<String, Object>>> getWeatherTypes() {
        List<Map<String, Object>> types = new ArrayList<>();
        for (WeatherType type : WeatherType.values()) {
            Map<String, Object> info = new HashMap<>();
            info.put("code", type.getCode());
            info.put("description", type.getDescription());
            info.put("sunFactor", type.getSunFactor());
            types.add(info);
        }
        return ResponseEntity.ok(types);
    }

    private BenchStatsVO createWeatherAdjustedVO(
            BenchDailyStats baseStats, Bench bench, WeatherType weather) {
        int baseSun = baseStats.getSunDurationMinutes();
        int adjustedSun = statsService.applyWeatherFactor(baseSun, weather);
        
        int totalDaylight = baseStats.getTotalDaylightMinutes() != null 
                ? baseStats.getTotalDaylightMinutes() 
                : BenchDailyStats.TOTAL_DAYLIGHT_MINUTES;
        
        int finalSun = Math.max(0, Math.min(totalDaylight, adjustedSun));
        double shadowPct = ((double) (totalDaylight - finalSun) / totalDaylight) * 100;
        shadowPct = Math.round(shadowPct * 10.0) / 10.0;
        shadowPct = Math.max(0.0, Math.min(100.0, shadowPct));

        return BenchStatsVO.builder()
                .benchId(bench.getId())
                .benchCode(bench.getBenchCode())
                .benchName(bench.getBenchName())
                .area(bench.getArea())
                .orientation(bench.getOrientation())
                .statDate(baseStats.getStatDate())
                .sunDurationMinutes(finalSun)
                .totalDaylightMinutes(totalDaylight)
                .shadowPercentage(shadowPct)
                .build();
    }

    private List<BenchStatsVO> getStatsWithWeather(LocalDate date, WeatherType weather) {
        Optional<List<BenchStatsVO>> cached = weatherCacheService.getCachedStats(date, weather);
        if (cached.isPresent()) {
            log.info("Returning cached stats for date={}, weather={}", date, weather.getCode());
            return cached.get();
        }

        log.info("Cache miss, computing stats for date={}, weather={}", date, weather.getCode());
        
        List<BenchDailyStats> baseStatsList = statsService.getStatsByDate(date);
        List<Bench> benches = benchService.getAllBenches();
        
        Map<Long, Bench> benchMap = benches.stream()
                .collect(Collectors.toMap(Bench::getId, b -> b));
        
        List<BenchStatsVO> voList = baseStatsList.stream()
                .map(stats -> createWeatherAdjustedVO(stats, benchMap.get(stats.getBenchId()), weather))
                .sorted(Comparator.comparing(BenchStatsVO::getBenchCode))
                .collect(Collectors.toList());

        weatherCacheService.cacheStats(date, weather, voList);
        
        return voList;
    }

    @GetMapping("/stats/today")
    public ResponseEntity<List<BenchStatsVO>> getTodayStats(
            @RequestParam(required = false) String weather) {
        WeatherType weatherType = WeatherType.fromCode(weather);
        LocalDate today = LocalDate.now();
        return ResponseEntity.ok(getStatsWithWeather(today, weatherType));
    }

    @GetMapping("/stats/date/{date}")
    public ResponseEntity<List<BenchStatsVO>> getStatsByDate(
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date,
            @RequestParam(required = false) String weather) {
        WeatherType weatherType = WeatherType.fromCode(weather);
        return ResponseEntity.ok(getStatsWithWeather(date, weatherType));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam(required = false) String weather) {
        WeatherType weatherType = WeatherType.fromCode(weather);
        List<BenchStatsVO> stats = getStatsWithWeather(LocalDate.now(), weatherType);
        Map<String, Object> summary = new HashMap<>();
        
        if (stats != null && !stats.isEmpty()) {
            double avgSun = stats.stream()
                    .mapToInt(BenchStatsVO::getSunDurationMinutes)
                    .average().orElse(0);
            double avgShadow = stats.stream()
                    .mapToDouble(BenchStatsVO::getShadowPercentage)
                    .average().orElse(0);
            
            summary.put("totalBenches", stats.size());
            summary.put("avgSunDurationMinutes", Math.round(avgSun));
            summary.put("avgShadowPercentage", Math.round(avgShadow * 10.0) / 10.0);
            summary.put("date", stats.get(0).getStatDate());
            summary.put("weather", weatherType.getCode());
            summary.put("weatherDescription", weatherType.getDescription());
            summary.put("weatherFactor", weatherType.getSunFactor());
            
            Map<String, List<BenchStatsVO>> byArea = stats.stream()
                    .collect(Collectors.groupingBy(BenchStatsVO::getArea));
            summary.put("byArea", byArea);
        }
        
        return ResponseEntity.ok(summary);
    }

    @DeleteMapping("/cache/{date}")
    public ResponseEntity<Map<String, String>> evictCache(
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        weatherCacheService.evictCache(date);
        Map<String, String> result = new HashMap<>();
        result.put("status", "success");
        result.put("message", "Cache evicted for date: " + date);
        return ResponseEntity.ok(result);
    }
}
