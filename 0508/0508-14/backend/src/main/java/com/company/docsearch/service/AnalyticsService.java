package com.company.docsearch.service;

import com.company.docsearch.entity.Document;
import com.company.docsearch.entity.SearchLog;
import com.company.docsearch.repository.DocumentRepository;
import com.company.docsearch.repository.SearchLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final SearchLogRepository searchLogRepository;
    private final DocumentRepository documentRepository;

    public Map<String, Object> getSearchVolumeTrend(int hours) {
        LocalDateTime startTime = LocalDateTime.now().minusHours(hours);
        List<Object[]> results = searchLogRepository.countByHourSince(startTime);

        Map<String, Long> hourCountMap = new LinkedHashMap<>();
        for (Object[] row : results) {
            String hour = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            hourCountMap.put(hour, count);
        }

        List<String> labels = new ArrayList<>();
        List<Long> data = new ArrayList<>();

        LocalDateTime current = startTime;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00");

        while (current.isBefore(LocalDateTime.now())) {
            String hourStr = current.format(formatter);
            labels.add(hourStr.substring(11, 13) + ":00");
            data.add(hourCountMap.getOrDefault(hourStr, 0L));
            current = current.plusHours(1);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("labels", labels);
        result.put("data", data);
        result.put("total", data.stream().mapToLong(Long::longValue).sum());

        return result;
    }

    public Map<String, Object> getNoResultRateTrend(int days) {
        LocalDateTime startTime = LocalDateTime.now().minusDays(days);
        List<SearchLog> allLogs = searchLogRepository.findLogsSince(startTime);
        List<SearchLog> noResultLogs = searchLogRepository.findNoResultLogsSince(startTime);

        Map<String, Long> totalByDay = new TreeMap<>();
        Map<String, Long> noResultByDay = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd");

        for (SearchLog log : allLogs) {
            String day = log.getTimestamp().format(formatter);
            totalByDay.merge(day, 1L, Long::sum);
        }

        for (SearchLog log : noResultLogs) {
            String day = log.getTimestamp().format(formatter);
            noResultByDay.merge(day, 1L, Long::sum);
        }

        List<String> labels = new ArrayList<>(totalByDay.keySet());
        List<Double> rates = new ArrayList<>();

        for (String day : labels) {
            long total = totalByDay.getOrDefault(day, 0L);
            long noResult = noResultByDay.getOrDefault(day, 0L);
            double rate = total > 0 ? (double) noResult / total * 100 : 0.0;
            rates.add(Math.round(rate * 100.0) / 100.0);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("labels", labels);
        result.put("data", rates);

        long totalAll = allLogs.size();
        long noResultAll = noResultLogs.size();
        double overallRate = totalAll > 0 ? (double) noResultAll / totalAll * 100 : 0.0;
        result.put("overallRate", Math.round(overallRate * 100.0) / 100.0);

        return result;
    }

    public List<Map<String, Object>> getClickHeatmap() {
        List<Object[]> categoryResults = documentRepository.countClickByCategory();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : categoryResults) {
            Map<String, Object> item = new HashMap<>();
            String category = row[0] != null ? (String) row[0] : "未分类";
            Long count = ((Number) row[1]).longValue();
            item.put("category", category);
            item.put("clickCount", count);
            result.add(item);
        }

        result.sort((a, b) -> Long.compare((Long) b.get("clickCount"), (Long) a.get("clickCount")));

        if (!result.isEmpty()) {
            long maxCount = (Long) result.get(0).get("clickCount");
            for (Map<String, Object> item : result) {
                long count = (Long) item.get("clickCount");
                double intensity = maxCount > 0 ? (double) count / maxCount : 0.0;
                item.put("intensity", Math.round(intensity * 100.0) / 100.0);
            }
        }

        return result;
    }

    public Map<String, Object> getWordCloudData(int limit) {
        List<Object[]> results = searchLogRepository.countByKeyword();

        List<Map<String, Object>> words = new ArrayList<>();
        int maxCount = 0;

        for (Object[] row : results) {
            String keyword = (String) row[0];
            int count = ((Number) row[1]).intValue();
            if (count > maxCount) maxCount = count;

            Map<String, Object> word = new HashMap<>();
            word.put("text", keyword);
            word.put("value", count);
            words.add(word);
        }

        words = words.stream().limit(limit).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("words", words);
        result.put("maxCount", maxCount);

        return result;
    }

    public Map<String, Object> getDocumentClickRanking(int limit) {
        List<Object[]> results = documentRepository.findTopClickDocuments();

        List<Map<String, Object>> ranking = results.stream()
                .limit(limit)
                .map(row -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("docId", row[0]);
                    item.put("title", row[1]);
                    item.put("clickCount", row[2]);
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("ranking", ranking);

        return result;
    }

    public Map<String, Object> getDashboardSummary() {
        LocalDateTime last24h = LocalDateTime.now().minusHours(24);
        LocalDateTime last7d = LocalDateTime.now().minusDays(7);

        Long total24h = searchLogRepository.countTotalSince(last24h);
        Long noResult24h = searchLogRepository.countNoResultSince(last24h);
        Long total7d = searchLogRepository.countTotalSince(last7d);
        Long noResult7d = searchLogRepository.countNoResultSince(last7d);

        double rate24h = total24h > 0 ? (double) noResult24h / total24h * 100 : 0.0;
        double rate7d = total7d > 0 ? (double) noResult7d / total7d * 100 : 0.0;

        List<Document> allDocs = documentRepository.findAll();
        int totalDocs = allDocs.size();
        int totalClicks = allDocs.stream()
                .mapToInt(d -> d.getClickCount() != null ? d.getClickCount() : 0)
                .sum();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSearches24h", total24h);
        summary.put("noResultRate24h", Math.round(rate24h * 100.0) / 100.0);
        summary.put("totalSearches7d", total7d);
        summary.put("noResultRate7d", Math.round(rate7d * 100.0) / 100.0);
        summary.put("totalDocuments", totalDocs);
        summary.put("totalClicks", totalClicks);

        return summary;
    }
}
