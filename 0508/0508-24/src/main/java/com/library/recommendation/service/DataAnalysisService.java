package com.library.recommendation.service;

import cn.hutool.core.util.StrUtil;
import com.library.recommendation.entity.BorrowRecord;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DataAnalysisService {

    private final BorrowRecordService borrowRecordService;
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final double DECAY_RATE = 0.05;

    public DataAnalysisService(BorrowRecordService borrowRecordService) {
        this.borrowRecordService = borrowRecordService;
    }

    @Data
    public static class RiverChartData {
        private String month;
        private Map<String, Double> tagWeights = new HashMap<>();

        public RiverChartData(String month) {
            this.month = month;
        }
    }

    @Data
    public static class RiverChartResult {
        private List<String> months;
        private List<String> tags;
        private List<Map<String, Object>> series;
    }

    @Data
    public static class BreadthData {
        private String month;
        private int categoryCount;
    }

    @Data
    public static class TrendingTag {
        private String tag;
        private double currentMonthCount;
        private double previousMonthCount;
        private double growthRate;
    }

    public RiverChartResult getInterestEvolutionRiverChart(Long readerId, int months) {
        LocalDateTime startTime = LocalDateTime.now().minusMonths(months);
        List<BorrowRecord> records = borrowRecordService.findByReaderId(readerId);
        
        records = records.stream()
                .filter(r -> r.getBorrowTime().isAfter(startTime))
                .collect(Collectors.toList());

        if (records.isEmpty()) {
            return buildEmptyRiverChartResult(months);
        }

        List<YearMonth> allMonths = generateMonthRange(startTime, LocalDateTime.now());
        Set<String> allTags = new HashSet<>();
        
        Map<String, List<BorrowRecord>> recordsByMonth = new TreeMap<>();
        for (BorrowRecord record : records) {
            YearMonth ym = YearMonth.from(record.getBorrowTime());
            String monthKey = ym.format(MONTH_FORMATTER);
            recordsByMonth.computeIfAbsent(monthKey, k -> new ArrayList<>()).add(record);
            
            if (StrUtil.isNotBlank(record.getTags())) {
                String[] tags = record.getTags().split(",");
                for (String tag : tags) {
                    tag = tag.trim();
                    if (StrUtil.isNotBlank(tag)) {
                        allTags.add(tag);
                    }
                }
            }
        }

        RiverChartResult result = new RiverChartResult();
        result.setMonths(allMonths.stream().map(m -> m.format(MONTH_FORMATTER)).collect(Collectors.toList()));
        result.setTags(new ArrayList<>(allTags));

        List<Map<String, Object>> series = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (String tag : allTags) {
            Map<String, Object> tagSeries = new HashMap<>();
            tagSeries.put("name", tag);
            
            List<Double> data = new ArrayList<>();
            for (YearMonth ym : allMonths) {
                String monthKey = ym.format(MONTH_FORMATTER);
                List<BorrowRecord> monthRecords = recordsByMonth.get(monthKey);
                
                double weight = 0;
                if (monthRecords != null) {
                    for (BorrowRecord record : monthRecords) {
                        if (StrUtil.isNotBlank(record.getTags())) {
                            String[] tags = record.getTags().split(",");
                            for (String t : tags) {
                                if (t.trim().equals(tag)) {
                                    long daysSinceBorrow = ChronoUnit.DAYS.between(record.getBorrowTime(), now);
                                    double timeDecay = Math.exp(-DECAY_RATE * daysSinceBorrow);
                                    weight += timeDecay;
                                }
                            }
                        }
                    }
                }
                data.add(weight);
            }
            tagSeries.put("data", data);
            series.add(tagSeries);
        }

        result.setSeries(series);
        return result;
    }

    private RiverChartResult buildEmptyRiverChartResult(int months) {
        RiverChartResult result = new RiverChartResult();
        List<YearMonth> allMonths = generateMonthRange(LocalDateTime.now().minusMonths(months), LocalDateTime.now());
        result.setMonths(allMonths.stream().map(m -> m.format(MONTH_FORMATTER)).collect(Collectors.toList()));
        result.setTags(new ArrayList<>());
        result.setSeries(new ArrayList<>());
        return result;
    }

    private List<YearMonth> generateMonthRange(LocalDateTime start, LocalDateTime end) {
        List<YearMonth> months = new ArrayList<>();
        YearMonth startYm = YearMonth.from(start);
        YearMonth endYm = YearMonth.from(end);
        
        YearMonth current = startYm;
        while (!current.isAfter(endYm)) {
            months.add(current);
            current = current.plusMonths(1);
        }
        return months;
    }

    public List<BreadthData> getReadingBreadthCurve(Long readerId, int months) {
        LocalDateTime startTime = LocalDateTime.now().minusMonths(months);
        List<BorrowRecord> records = borrowRecordService.findByReaderId(readerId);
        
        records = records.stream()
                .filter(r -> r.getBorrowTime().isAfter(startTime))
                .collect(Collectors.toList());

        if (records.isEmpty()) {
            return Collections.emptyList();
        }

        List<YearMonth> allMonths = generateMonthRange(startTime, LocalDateTime.now());
        
        Map<String, Set<String>> categoriesByMonth = new HashMap<>();
        for (YearMonth ym : allMonths) {
            categoriesByMonth.put(ym.format(MONTH_FORMATTER), new HashSet<>());
        }

        for (BorrowRecord record : records) {
            YearMonth ym = YearMonth.from(record.getBorrowTime());
            String monthKey = ym.format(MONTH_FORMATTER);
            if (StrUtil.isNotBlank(record.getCategory())) {
                categoriesByMonth.computeIfAbsent(monthKey, k -> new HashSet<>()).add(record.getCategory());
            }
        }

        Set<String> cumulativeCategories = new HashSet<>();
        List<BreadthData> result = new ArrayList<>();
        for (YearMonth ym : allMonths) {
            String monthKey = ym.format(MONTH_FORMATTER);
            cumulativeCategories.addAll(categoriesByMonth.getOrDefault(monthKey, new HashSet<>()));
            
            BreadthData data = new BreadthData();
            data.setMonth(monthKey);
            data.setCategoryCount(cumulativeCategories.size());
            result.add(data);
        }

        return result;
    }

    public List<TrendingTag> getTrendingTags(int limit) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime currentMonthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime previousMonthStart = currentMonthStart.minusMonths(1);
        LocalDateTime twoMonthsAgoStart = currentMonthStart.minusMonths(2);

        List<Map<String, Object>> allTagCounts = borrowRecordService.findAllMonthlyTagCounts(twoMonthsAgoStart);

        Map<String, Double> currentMonthMap = new HashMap<>();
        Map<String, Double> previousMonthMap = new HashMap<>();

        String currentMonthKey = YearMonth.from(currentMonthStart).format(MONTH_FORMATTER);
        String previousMonthKey = YearMonth.from(previousMonthStart).format(MONTH_FORMATTER);

        for (Map<String, Object> row : allTagCounts) {
            String tag = (String) row.get("tag");
            String month = (String) row.get("month");
            Number count = (Number) row.get("count");
            
            if (currentMonthKey.equals(month)) {
                currentMonthMap.put(tag, currentMonthMap.getOrDefault(tag, 0.0) + count.doubleValue());
            } else if (previousMonthKey.equals(month)) {
                previousMonthMap.put(tag, previousMonthMap.getOrDefault(tag, 0.0) + count.doubleValue());
            }
        }

        Set<String> allTags = new HashSet<>();
        allTags.addAll(currentMonthMap.keySet());
        allTags.addAll(previousMonthMap.keySet());

        List<TrendingTag> trendingTags = new ArrayList<>();
        for (String tag : allTags) {
            double current = currentMonthMap.getOrDefault(tag, 0.0);
            double previous = previousMonthMap.getOrDefault(tag, 0.0);

            double growthRate;
            if (previous == 0) {
                growthRate = current > 0 ? 100.0 : 0;
            } else {
                growthRate = ((current - previous) / previous) * 100;
            }

            TrendingTag trendingTag = new TrendingTag();
            trendingTag.setTag(tag);
            trendingTag.setCurrentMonthCount(current);
            trendingTag.setPreviousMonthCount(previous);
            trendingTag.setGrowthRate(growthRate);
            trendingTags.add(trendingTag);
        }

        return trendingTags.stream()
                .sorted((a, b) -> Double.compare(b.getGrowthRate(), a.getGrowthRate()))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
