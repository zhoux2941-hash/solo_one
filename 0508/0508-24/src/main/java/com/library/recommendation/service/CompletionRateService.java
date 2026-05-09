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
public class CompletionRateService {

    private final BorrowRecordService borrowRecordService;
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final int DEFAULT_PAGES_PER_DAY = 20;
    private static final double ABANDONED_THRESHOLD = 0.3;

    public CompletionRateService(BorrowRecordService borrowRecordService) {
        this.borrowRecordService = borrowRecordService;
    }

    @Data
    public static class CompletionRateData {
        private String month;
        private double completionRate;
        private int totalBorrows;
        private int completedCount;
        private int abandonedCount;
    }

    @Data
    public static class AbandonedCategory {
        private String category;
        private int totalBorrows;
        private int abandonedCount;
        private double abandonRate;
    }

    @Data
    public static class CompletionStats {
        private double overallCompletionRate;
        private int totalBorrows;
        private int completedCount;
        private int abandonedCount;
        private double averageCompletionRate;
        private List<String> bestCategories;
        private List<String> worstCategories;
    }

    @Data
    public static class BorrowCompletionDetail {
        private Long recordId;
        private String bookTitle;
        private String category;
        private Integer pages;
        private LocalDateTime borrowTime;
        private LocalDateTime dueTime;
        private LocalDateTime returnTime;
        private double expectedDays;
        private double actualDays;
        private double completionRate;
        private boolean isCompleted;
        private boolean isAbandoned;
    }

    public LocalDateTime calculateDueTime(Integer pages, LocalDateTime borrowTime) {
        if (pages == null || pages <= 0) {
            return borrowTime.plusDays(14);
        }
        double expectedDays = Math.ceil((double) pages / DEFAULT_PAGES_PER_DAY);
        return borrowTime.plusDays((long) expectedDays);
    }

    public double calculateCompletionRate(BorrowRecord record) {
        return calculateCompletionRate(record, LocalDateTime.now());
    }

    public double calculateCompletionRate(BorrowRecord record, LocalDateTime now) {
        if (record.getBorrowTime() == null) {
            return 0;
        }

        LocalDateTime endTime = record.getReturnTime() != null ? record.getReturnTime() : now;

        Integer pages = record.getPages();
        if (pages == null || pages <= 0) {
            pages = 300;
        }

        double expectedDays = Math.ceil((double) pages / DEFAULT_PAGES_PER_DAY);
        double actualDays = ChronoUnit.DAYS.between(record.getBorrowTime(), endTime);
        actualDays = Math.max(actualDays, 0.5);

        double completionRate = actualDays / expectedDays;
        return Math.min(completionRate, 1.0);
    }

    public boolean isCompleted(BorrowRecord record) {
        if (record.getReturnTime() == null) {
            return false;
        }
        double rate = calculateCompletionRate(record);
        return rate >= 0.7;
    }

    public boolean isAbandoned(BorrowRecord record) {
        if (record.getReturnTime() == null) {
            return false;
        }
        double rate = calculateCompletionRate(record);
        return rate < ABANDONED_THRESHOLD;
    }

    public List<CompletionRateData> getMonthlyCompletionRate(Long readerId, int months) {
        LocalDateTime startTime = LocalDateTime.now().minusMonths(months);
        List<BorrowRecord> records = borrowRecordService.findByReaderId(readerId);

        records = records.stream()
                .filter(r -> r.getBorrowTime().isAfter(startTime))
                .collect(Collectors.toList());

        if (records.isEmpty()) {
            return Collections.emptyList();
        }

        List<YearMonth> allMonths = generateMonthRange(startTime, LocalDateTime.now());

        Map<String, List<BorrowRecord>> recordsByMonth = new TreeMap<>();
        for (YearMonth ym : allMonths) {
            recordsByMonth.put(ym.format(MONTH_FORMATTER), new ArrayList<>());
        }

        for (BorrowRecord record : records) {
            YearMonth ym = YearMonth.from(record.getBorrowTime());
            String monthKey = ym.format(MONTH_FORMATTER);
            recordsByMonth.computeIfAbsent(monthKey, k -> new ArrayList<>()).add(record);
        }

        List<CompletionRateData> result = new ArrayList<>();
        for (YearMonth ym : allMonths) {
            String monthKey = ym.format(MONTH_FORMATTER);
            List<BorrowRecord> monthRecords = recordsByMonth.getOrDefault(monthKey, Collections.emptyList());

            int total = monthRecords.size();
            int completed = 0;
            int abandoned = 0;
            double totalRate = 0;

            for (BorrowRecord record : monthRecords) {
                double rate = calculateCompletionRate(record);
                totalRate += rate;

                if (isCompleted(record)) {
                    completed++;
                }
                if (isAbandoned(record)) {
                    abandoned++;
                }
            }

            CompletionRateData data = new CompletionRateData();
            data.setMonth(monthKey);
            data.setTotalBorrows(total);
            data.setCompletedCount(completed);
            data.setAbandonedCount(abandoned);
            data.setCompletionRate(total > 0 ? totalRate / total : 0);

            result.add(data);
        }

        return result;
    }

    public List<AbandonedCategory> getAbandonedCategories(Long readerId) {
        List<BorrowRecord> records = borrowRecordService.findByReaderId(readerId);

        if (records.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<BorrowRecord>> recordsByCategory = new HashMap<>();
        for (BorrowRecord record : records) {
            if (StrUtil.isNotBlank(record.getCategory())) {
                recordsByCategory.computeIfAbsent(record.getCategory(), k -> new ArrayList<>()).add(record);
            }
        }

        List<AbandonedCategory> result = new ArrayList<>();
        for (Map.Entry<String, List<BorrowRecord>> entry : recordsByCategory.entrySet()) {
            String category = entry.getKey();
            List<BorrowRecord> categoryRecords = entry.getValue();

            int total = categoryRecords.size();
            int abandoned = 0;

            for (BorrowRecord record : categoryRecords) {
                if (isAbandoned(record)) {
                    abandoned++;
                }
            }

            AbandonedCategory ac = new AbandonedCategory();
            ac.setCategory(category);
            ac.setTotalBorrows(total);
            ac.setAbandonedCount(abandoned);
            ac.setAbandonRate(total > 0 ? (double) abandoned / total : 0);

            result.add(ac);
        }

        return result.stream()
                .sorted((a, b) -> Double.compare(b.getAbandonRate(), a.getAbandonRate()))
                .collect(Collectors.toList());
    }

    public Map<String, Double> getCategoryAbandonRates(Long readerId) {
        List<AbandonedCategory> categories = getAbandonedCategories(readerId);
        Map<String, Double> rates = new HashMap<>();
        for (AbandonedCategory ac : categories) {
            rates.put(ac.getCategory(), ac.getAbandonRate());
        }
        return rates;
    }

    public CompletionStats getCompletionStats(Long readerId) {
        List<BorrowRecord> records = borrowRecordService.findByReaderId(readerId);
        CompletionStats stats = new CompletionStats();

        if (records.isEmpty()) {
            stats.setTotalBorrows(0);
            stats.setCompletedCount(0);
            stats.setAbandonedCount(0);
            stats.setOverallCompletionRate(0);
            stats.setAverageCompletionRate(0);
            stats.setBestCategories(new ArrayList<>());
            stats.setWorstCategories(new ArrayList<>());
            return stats;
        }

        int total = records.size();
        int completed = 0;
        int abandoned = 0;
        double totalRate = 0;

        for (BorrowRecord record : records) {
            double rate = calculateCompletionRate(record);
            totalRate += rate;

            if (isCompleted(record)) {
                completed++;
            }
            if (isAbandoned(record)) {
                abandoned++;
            }
        }

        stats.setTotalBorrows(total);
        stats.setCompletedCount(completed);
        stats.setAbandonedCount(abandoned);
        stats.setOverallCompletionRate((double) completed / total);
        stats.setAverageCompletionRate(totalRate / total);

        List<AbandonedCategory> categories = getAbandonedCategories(readerId);
        List<AbandonedCategory> validCategories = categories.stream()
                .filter(c -> c.getTotalBorrows() >= 2)
                .collect(Collectors.toList());

        stats.setBestCategories(validCategories.stream()
                .sorted((a, b) -> Double.compare(a.getAbandonRate(), b.getAbandonRate()))
                .limit(3)
                .map(AbandonedCategory::getCategory)
                .collect(Collectors.toList()));

        stats.setWorstCategories(validCategories.stream()
                .sorted((a, b) -> Double.compare(b.getAbandonRate(), a.getAbandonRate()))
                .limit(3)
                .map(AbandonedCategory::getCategory)
                .collect(Collectors.toList()));

        return stats;
    }

    public List<BorrowCompletionDetail> getRecentCompletionDetails(Long readerId, int limit) {
        List<BorrowRecord> records = borrowRecordService.findByReaderId(readerId);

        return records.stream()
                .limit(limit)
                .map(this::toCompletionDetail)
                .collect(Collectors.toList());
    }

    private BorrowCompletionDetail toCompletionDetail(BorrowRecord record) {
        BorrowCompletionDetail detail = new BorrowCompletionDetail();
        detail.setRecordId(record.getId());
        detail.setCategory(record.getCategory());
        detail.setPages(record.getPages());
        detail.setBorrowTime(record.getBorrowTime());
        detail.setDueTime(record.getDueTime());
        detail.setReturnTime(record.getReturnTime());

        Integer pages = record.getPages();
        if (pages == null || pages <= 0) {
            pages = 300;
        }

        double expectedDays = Math.ceil((double) pages / DEFAULT_PAGES_PER_DAY);
        detail.setExpectedDays(expectedDays);

        LocalDateTime endTime = record.getReturnTime() != null ? record.getReturnTime() : LocalDateTime.now();
        double actualDays = ChronoUnit.DAYS.between(record.getBorrowTime(), endTime);
        actualDays = Math.max(actualDays, 0.5);
        detail.setActualDays(actualDays);

        double completionRate = Math.min(actualDays / expectedDays, 1.0);
        detail.setCompletionRate(completionRate);
        detail.setCompleted(record.getReturnTime() != null && completionRate >= 0.7);
        detail.setAbandoned(record.getReturnTime() != null && completionRate < ABANDONED_THRESHOLD);

        return detail;
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
}
