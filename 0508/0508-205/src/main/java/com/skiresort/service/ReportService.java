package com.skiresort.service;

import com.skiresort.model.QueueRecord;
import com.skiresort.model.VisitorRecord;
import com.skiresort.repository.QueueRecordRepository;
import com.skiresort.repository.VisitorRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private VisitorRecordRepository visitorRecordRepository;

    @Autowired
    private QueueRecordRepository queueRecordRepository;

    public Map<String, Object> getDailyVisitorReport(LocalDate date) {
        List<VisitorRecord> records = visitorRecordRepository.findByRecordDateOrderByRecordHour(date);
        
        Map<Integer, Integer> hourlyVisitors = new HashMap<>();
        for (int i = 0; i < 24; i++) {
            hourlyVisitors.put(i, 0);
        }

        Map<Long, Integer> slopeVisitors = new HashMap<>();

        int totalVisitors = 0;

        for (VisitorRecord record : records) {
            int hour = record.getRecordHour();
            hourlyVisitors.put(hour, hourlyVisitors.get(hour) + record.getVisitorCount());
            
            Long slopeId = record.getSlope().getId();
            slopeVisitors.put(slopeId, slopeVisitors.getOrDefault(slopeId, 0) + record.getVisitorCount());
            
            totalVisitors += record.getVisitorCount();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("date", date);
        result.put("totalVisitors", totalVisitors);
        result.put("hourlyVisitors", hourlyVisitors);
        result.put("slopeVisitors", slopeVisitors);

        List<Integer> peakHours = hourlyVisitors.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        result.put("peakHours", peakHours);

        return result;
    }

    public Map<String, Object> getQueueReport(LocalDateTime start, LocalDateTime end) {
        List<QueueRecord> records = queueRecordRepository.findByRecordTimeBetween(start, end);

        Map<Long, List<QueueRecord>> recordsByLift = records.stream()
                .collect(Collectors.groupingBy(r -> r.getLift().getId()));

        Map<Long, Map<String, Object>> liftStats = new HashMap<>();

        for (Map.Entry<Long, List<QueueRecord>> entry : recordsByLift.entrySet()) {
            Long liftId = entry.getKey();
            List<QueueRecord> liftRecords = entry.getValue();

            IntSummaryStatistics queueStats = liftRecords.stream()
                    .mapToInt(QueueRecord::getQueueSize)
                    .summaryStatistics();

            IntSummaryStatistics waitStats = liftRecords.stream()
                    .mapToInt(QueueRecord::getWaitTimeMinutes)
                    .summaryStatistics();

            Map<Integer, Integer> hourlyPeakQueue = new HashMap<>();
            for (QueueRecord record : liftRecords) {
                int hour = record.getRecordTime().getHour();
                int current = hourlyPeakQueue.getOrDefault(hour, 0);
                if (record.getQueueSize() > current) {
                    hourlyPeakQueue.put(hour, record.getQueueSize());
                }
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("avgQueueSize", Math.round(queueStats.getAverage()));
            stats.put("maxQueueSize", queueStats.getMax());
            stats.put("avgWaitTime", Math.round(waitStats.getAverage()));
            stats.put("maxWaitTime", waitStats.getMax());
            stats.put("hourlyPeakQueue", hourlyPeakQueue);
            stats.put("liftName", liftRecords.get(0).getLift().getName());

            liftStats.put(liftId, stats);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("startTime", start);
        result.put("endTime", end);
        result.put("liftStats", liftStats);

        return result;
    }

    public List<VisitorRecord> getVisitorRecordsByDateRange(LocalDate startDate, LocalDate endDate) {
        return visitorRecordRepository.findByRecordDateBetween(startDate, endDate);
    }
}
