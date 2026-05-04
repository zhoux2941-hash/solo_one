package com.loganalysis.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.json.JsonData;
import com.loganalysis.entity.AnomalyRecord;
import com.loganalysis.repository.AnomalyRecordRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
public class AnomalyDetectionService {

    @Autowired
    private ElasticsearchClient elasticsearchClient;

    @Autowired
    private AnomalyRecordRepository anomalyRecordRepository;

    @Autowired
    private DingTalkAlertService dingTalkAlertService;

    private static final DateTimeFormatter ES_DATE_FORMAT = DateTimeFormatter.ISO_DATE_TIME;

    private static final String INDEX_PATTERN = "logs-*";
    private static final String OLD_INDEX_NAME = "logs";

    private static final List<String> QUERY_INDICES = Arrays.asList(INDEX_PATTERN, OLD_INDEX_NAME);

    @Value("${anomaly.detection.enabled:true}")
    private boolean detectionEnabled;

    @Value("${anomaly.detection.window-minutes:30}")
    private int windowMinutes;

    @Value("${anomaly.detection.threshold-sigma:2.0}")
    private double thresholdSigma;

    @Value("${anomaly.detection.min-history-points:5}")
    private int minHistoryPoints;

    @Value("${anomaly.alert.enabled:true}")
    private boolean alertEnabled;

    @Value("${anomaly.alert.cooldown-minutes:10}")
    private int cooldownMinutes;

    private LocalDateTime lastAlertTime = null;
    private final Object alertLock = new Object();

    private List<String> getQueryIndexNames() {
        return QUERY_INDICES;
    }

    public static class AnomalyDetectionResult {
        private LocalDateTime time;
        private boolean isAnomaly;
        private double actualValue;
        private double mean;
        private double stdDev;
        private double threshold;
        private double score;
        private String level;
        private String message;

        public LocalDateTime getTime() { return time; }
        public void setTime(LocalDateTime time) { this.time = time; }
        public boolean isAnomaly() { return isAnomaly; }
        public void setAnomaly(boolean anomaly) { isAnomaly = anomaly; }
        public double getActualValue() { return actualValue; }
        public void setActualValue(double actualValue) { this.actualValue = actualValue; }
        public double getMean() { return mean; }
        public void setMean(double mean) { this.mean = mean; }
        public double getStdDev() { return stdDev; }
        public void setStdDev(double stdDev) { this.stdDev = stdDev; }
        public double getThreshold() { return threshold; }
        public void setThreshold(double threshold) { this.threshold = threshold; }
        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class TimeSeriesPoint {
        private LocalDateTime time;
        private long count;

        public TimeSeriesPoint(LocalDateTime time, long count) {
            this.time = time;
            this.count = count;
        }

        public LocalDateTime getTime() { return time; }
        public long getCount() { return count; }
    }

    @Scheduled(fixedRateString = "${anomaly.detection.interval-ms:60000}")
    public void scheduledDetection() {
        if (!detectionEnabled) {
            log.debug("异常检测已禁用，跳过定时检测");
            return;
        }

        log.info("开始执行定时异常检测");
        try {
            detectAnomalies(null, null, null);
        } catch (Exception e) {
            log.error("定时异常检测执行失败", e);
        }
    }

    public List<AnomalyDetectionResult> detectAnomalies(
            LocalDateTime startTime,
            LocalDateTime endTime,
            String logType) {
        
        LocalDateTime now = LocalDateTime.now();
        
        if (endTime == null) {
            endTime = now.truncatedTo(ChronoUnit.MINUTES);
        }
        if (startTime == null) {
            startTime = endTime.minusMinutes(windowMinutes);
        }

        log.info("执行异常检测: 时间范围=[{}, {}], logType={}", startTime, endTime, logType);

        List<AnomalyDetectionResult> results = new ArrayList<>();
        
        try {
            List<TimeSeriesPoint> timeSeries = getPerMinuteCounts(startTime, endTime, logType);
            
            if (timeSeries.size() < minHistoryPoints) {
                log.warn("历史数据点不足: 当前={}, 需要={}", timeSeries.size(), minHistoryPoints);
                return results;
            }

            List<TimeSeriesPoint> historyPoints = new ArrayList<>();
            LocalDateTime targetTime = endTime;

            for (TimeSeriesPoint point : timeSeries) {
                if (point.getTime().isBefore(targetTime)) {
                    historyPoints.add(point);
                }
            }

            long targetCount = 0;
            for (TimeSeriesPoint point : timeSeries) {
                if (point.getTime().equals(targetTime)) {
                    targetCount = point.getCount();
                    break;
                }
            }

            if (historyPoints.size() >= minHistoryPoints) {
                double mean = calculateMean(historyPoints);
                double stdDev = calculateStdDev(historyPoints, mean);
                double threshold = mean + thresholdSigma * stdDev;

                AnomalyDetectionResult result = new AnomalyDetectionResult();
                result.setTime(targetTime);
                result.setActualValue(targetCount);
                result.setMean(mean);
                result.setStdDev(stdDev);
                result.setThreshold(threshold);

                if (targetCount > threshold && stdDev > 0) {
                    double score = (targetCount - mean) / stdDev;
                    result.setScore(score);
                    result.setAnomaly(true);

                    if (score >= 3 * thresholdSigma) {
                        result.setLevel("CRITICAL");
                        result.setMessage(String.format("严重异常: 日志量突增 %.2f 倍标准差", score));
                    } else if (score >= 2 * thresholdSigma) {
                        result.setLevel("WARNING");
                        result.setMessage(String.format("警告异常: 日志量突增 %.2f 倍标准差", score));
                    } else {
                        result.setLevel("INFO");
                        result.setMessage(String.format("轻微异常: 日志量突增 %.2f 倍标准差", score));
                    }

                    saveAnomalyRecord(result, logType);

                    if (shouldSendAlert()) {
                        sendAlert(result, logType, historyPoints);
                    }
                } else {
                    result.setScore(0);
                    result.setAnomaly(false);
                    result.setLevel("NORMAL");
                    result.setMessage("正常: 日志量在预期范围内");
                }

                results.add(result);
            }

        } catch (Exception e) {
            log.error("异常检测执行失败", e);
        }

        return results;
    }

    public List<AnomalyDetectionResult> detectAnomaliesInRange(
            LocalDateTime startTime,
            LocalDateTime endTime,
            String logType) {
        
        log.info("检测时间范围内的异常: [{}, {}], logType={}", startTime, endTime, logType);

        List<AnomalyDetectionResult> results = new ArrayList<>();
        
        try {
            List<TimeSeriesPoint> timeSeries = getPerMinuteCounts(startTime, endTime, logType);
            
            if (timeSeries.size() < minHistoryPoints + 1) {
                log.warn("数据点不足: 当前={}, 需要={} + 1", timeSeries.size(), minHistoryPoints);
                return results;
            }

            for (int i = minHistoryPoints; i < timeSeries.size(); i++) {
                List<TimeSeriesPoint> historyPoints = new ArrayList<>();
                for (int j = Math.max(0, i - windowMinutes); j < i; j++) {
                    historyPoints.add(timeSeries.get(j));
                }

                if (historyPoints.size() < minHistoryPoints) {
                    continue;
                }

                TimeSeriesPoint targetPoint = timeSeries.get(i);
                double mean = calculateMean(historyPoints);
                double stdDev = calculateStdDev(historyPoints, mean);
                double threshold = mean + thresholdSigma * stdDev;

                AnomalyDetectionResult result = new AnomalyDetectionResult();
                result.setTime(targetPoint.getTime());
                result.setActualValue(targetPoint.getCount());
                result.setMean(mean);
                result.setStdDev(stdDev);
                result.setThreshold(threshold);

                if (targetPoint.getCount() > threshold && stdDev > 0) {
                    double score = (targetPoint.getCount() - mean) / stdDev;
                    result.setScore(score);
                    result.setAnomaly(true);

                    if (score >= 3 * thresholdSigma) {
                        result.setLevel("CRITICAL");
                    } else if (score >= 2 * thresholdSigma) {
                        result.setLevel("WARNING");
                    } else {
                        result.setLevel("INFO");
                    }
                    result.setMessage(String.format("异常检测: 日志量=%d, 均值=%.2f, 标准差=%.2f, 阈值=%.2f, 分数=%.2f",
                        targetPoint.getCount(), mean, stdDev, threshold, score));

                } else {
                    result.setScore(0);
                    result.setAnomaly(false);
                    result.setLevel("NORMAL");
                    result.setMessage("正常");
                }

                results.add(result);
            }

        } catch (Exception e) {
            log.error("异常检测执行失败", e);
        }

        return results;
    }

    private List<TimeSeriesPoint> getPerMinuteCounts(
            LocalDateTime startTime,
            LocalDateTime endTime,
            String logType) throws IOException {

        List<Query> queries = new ArrayList<>();

        if (startTime != null && endTime != null) {
            Query rangeQuery = RangeQuery.of(r -> r
                .field("timestamp")
                .gte(JsonData.of(startTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                .lte(JsonData.of(endTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
            )._toQuery();
            queries.add(rangeQuery);
        }

        if (logType != null && !logType.trim().isEmpty()) {
            Query typeQuery = TermQuery.of(t -> t
                .field("logType")
                .value(logType.toLowerCase())
            )._toQuery();
            queries.add(typeQuery);
        }

        Query finalQuery;
        if (queries.isEmpty()) {
            finalQuery = MatchAllQuery.of(m -> m)._toQuery();
        } else if (queries.size() == 1) {
            finalQuery = queries.get(0);
        } else {
            finalQuery = BoolQuery.of(b -> b.must(queries))._toQuery();
        }

        SearchRequest request = new SearchRequest.Builder()
            .index(getQueryIndexNames())
            .query(finalQuery)
            .size(0)
            .aggregations("per_minute", a -> a
                .dateHistogram(d -> d
                    .field("timestamp")
                    .calendarInterval(co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval.Minute)
                    .format("yyyy-MM-dd HH:mm:ss")
                    .minDocCount(0L)
                )
            )
            .build();

        SearchResponse<Map> response = elasticsearchClient.search(request, Map.class);
        
        List<TimeSeriesPoint> points = new ArrayList<>();
        var agg = response.aggregations().get("per_minute").dateHistogram();
        
        if (agg != null && agg.buckets() != null) {
            for (var bucket : agg.buckets().array()) {
                try {
                    String timeStr = bucket.keyAsString();
                    if (timeStr != null) {
                        LocalDateTime time = LocalDateTime.parse(
                            timeStr.replace(' ', 'T'), 
                            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
                        );
                        points.add(new TimeSeriesPoint(time, bucket.docCount()));
                    }
                } catch (Exception e) {
                    log.warn("解析时间戳失败: {}", bucket.keyAsString(), e);
                }
            }
        }

        return points;
    }

    private double calculateMean(List<TimeSeriesPoint> points) {
        if (points.isEmpty()) return 0;
        return points.stream()
            .mapToLong(TimeSeriesPoint::getCount)
            .average()
            .orElse(0);
    }

    private double calculateStdDev(List<TimeSeriesPoint> points, double mean) {
        if (points.size() <= 1) return 0;
        
        double sumSquaredDiff = points.stream()
            .mapToDouble(p -> Math.pow(p.getCount() - mean, 2))
            .sum();
        
        return Math.sqrt(sumSquaredDiff / (points.size() - 1));
    }

    private void saveAnomalyRecord(AnomalyDetectionResult result, String logType) {
        try {
            LocalDateTime time = result.getTime();
            if (time == null) {
                time = LocalDateTime.now();
            }

            List<AnomalyRecord> existing = anomalyRecordRepository.findExactMatch(
                time,
                logType != null ? logType : "ALL",
                "SYSTEM"
            );

            if (!existing.isEmpty()) {
                log.debug("相同的异常记录已存在，跳过保存: time={}, logType={}", time, logType);
                return;
            }

            AnomalyRecord record = new AnomalyRecord();
            record.setAnomalyTime(time);
            record.setAnomalyType("SPIKE");
            record.setAnomalyLevel(result.getLevel());
            record.setScore(result.getScore());
            record.setThreshold(result.getThreshold());
            record.setActualValue(result.getActualValue());
            record.setMessage(result.getMessage());
            record.setLogType(logType != null ? logType : "ALL");
            record.setSource("SYSTEM");
            record.setIsAcknowledged(false);

            Map<String, Object> details = new HashMap<>();
            details.put("mean", result.getMean());
            details.put("stdDev", result.getStdDev());
            details.put("thresholdSigma", thresholdSigma);
            details.put("windowMinutes", windowMinutes);
            try {
                record.setDetails(new ObjectMapper().writeValueAsString(details));
            } catch (Exception e) {
                log.warn("序列化详情失败", e);
            }

            anomalyRecordRepository.save(record);
            log.info("异常记录已保存: time={}, level={}, score={}", time, result.getLevel(), result.getScore());

        } catch (Exception e) {
            log.error("保存异常记录失败", e);
        }
    }

    private boolean shouldSendAlert() {
        if (!alertEnabled) return false;
        
        synchronized (alertLock) {
            if (lastAlertTime == null) {
                lastAlertTime = LocalDateTime.now();
                return true;
            }
            
            LocalDateTime cooldownEnd = lastAlertTime.plusMinutes(cooldownMinutes);
            if (LocalDateTime.now().isAfter(cooldownEnd)) {
                lastAlertTime = LocalDateTime.now();
                return true;
            }
            
            log.info("处于冷却期内，跳过报警: 上次报警={}, 冷却期结束={}", 
                lastAlertTime, cooldownEnd);
            return false;
        }
    }

    private void sendAlert(AnomalyDetectionResult result, String logType, List<TimeSeriesPoint> historyPoints) {
        try {
            String title = "【日志异常报警】日志量突增检测";
            
            StringBuilder content = new StringBuilder();
            content.append("### 日志异常报警\n\n");
            content.append("**检测时间**: ").append(result.getTime()).append("\n\n");
            content.append("**异常级别**: ").append(getLevelEmoji(result.getLevel())).append(" ").append(result.getLevel()).append("\n\n");
            content.append("**异常分数**: ").append(String.format("%.2f σ", result.getScore())).append("\n\n");
            content.append("**详细信息**:\n");
            content.append("- 当前分钟日志量: **").append((long) result.getActualValue()).append("** 条\n");
            content.append("- 历史均值: **").append(String.format("%.2f", result.getMean())).append("** 条\n");
            content.append("- 历史标准差: **").append(String.format("%.2f", result.getStdDev())).append("**\n");
            content.append("- 报警阈值: **").append(String.format("%.2f", result.getThreshold())).append("** 条 (均值 + ").append(thresholdSigma).append("σ)\n\n");
            
            if (logType != null && !logType.isEmpty()) {
                content.append("**日志类型**: ").append(logType).append("\n\n");
            }
            
            content.append("---\n");
            content.append("*请检查系统是否存在异常流量或错误爆发*\n");

            dingTalkAlertService.sendMarkdownAlert(title, content.toString());
            log.info("钉钉报警已发送: level={}, score={}", result.getLevel(), result.getScore());

        } catch (Exception e) {
            log.error("发送钉钉报警失败", e);
        }
    }

    private String getLevelEmoji(String level) {
        if (level == null) return "⚠️";
        return switch (level.toUpperCase()) {
            case "CRITICAL" -> "🔴";
            case "WARNING" -> "🟡";
            case "INFO" -> "🔵";
            default -> "⚠️";
        };
    }

    public List<AnomalyRecord> getRecentAnomalies(int limit) {
        return anomalyRecordRepository.findRecentUnacknowledged(
            LocalDateTime.now().minusDays(7)
        ).stream().limit(limit).toList();
    }

    public long getUnacknowledgedCount() {
        return anomalyRecordRepository.countUnacknowledgedByTimeRange(
            LocalDateTime.now().minusDays(7),
            LocalDateTime.now()
        );
    }

    public AnomalyRecord acknowledge(Long id, String acknowledgedBy) {
        Optional<AnomalyRecord> opt = anomalyRecordRepository.findById(id);
        if (opt.isPresent()) {
            AnomalyRecord record = opt.get();
            record.setIsAcknowledged(true);
            record.setAcknowledgedAt(LocalDateTime.now());
            record.setAcknowledgedBy(acknowledgedBy != null ? acknowledgedBy : "SYSTEM");
            return anomalyRecordRepository.save(record);
        }
        return null;
    }
}
