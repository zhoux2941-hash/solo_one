package com.loganalysis.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import co.elastic.clients.elasticsearch.core.*;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.json.JsonData;
import com.loganalysis.entity.LogEntry;
import com.loganalysis.repository.LogEntryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 日志服务类，处理日志的存储、查询和统计
 */
@Service
@Slf4j
public class LogService {

    @Autowired
    private LogEntryRepository logEntryRepository;

    @Autowired
    private ElasticsearchClient elasticsearchClient;

    // 使用通配符索引，支持查询所有日志滚动索引
    // 如 logs-2024.01.01, logs-2024.01.02 等
    private static final String INDEX_PATTERN = "logs-*";
    // 兼容旧索引
    private static final String OLD_INDEX_NAME = "logs";
    // 索引前缀（用于写入时生成日期索引）
    private static final String INDEX_PREFIX = "logs-";
    
    private static final DateTimeFormatter ES_DATE_FORMAT = DateTimeFormatter.ISO_DATE_TIME;

    /**
     * 保存单个日志条目
     */
    public LogEntry saveLogEntry(LogEntry entry) {
        return logEntryRepository.save(entry);
    }

    /**
     * 批量保存日志条目
     */
    public List<LogEntry> saveLogEntries(List<LogEntry> entries) {
        return (List<LogEntry>) logEntryRepository.saveAll(entries);
    }

    /**
     * 批量保存日志条目（使用 Elasticsearch Client 高效批量插入）
     * 优化：根据日志时间自动选择日期索引，支持索引滚动
     */
    public int bulkSaveLogEntries(List<LogEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return 0;
        }

        try {
            List<BulkOperation> operations = new ArrayList<>();
            
            for (LogEntry entry : entries) {
                String indexName = determineIndexName(entry);
                Map<String, Object> doc = convertLogEntryToMap(entry);
                
                BulkOperation op = new BulkOperation.Builder()
                    .create(c -> c
                        .index(indexName)
                        .document(doc)
                    )
                    .build();
                operations.add(op);
            }

            BulkRequest request = new BulkRequest.Builder()
                .operations(operations)
                .build();

            BulkResponse response = elasticsearchClient.bulk(request);
            
            int successCount = 0;
            for (var item : response.items()) {
                if (item.error() == null) {
                    successCount++;
                } else {
                    log.error("批量插入失败: {}", item.error().reason());
                }
            }

            log.info("批量插入完成，成功: {}, 总数: {}", successCount, entries.size());
            return successCount;

        } catch (IOException e) {
            log.error("批量插入日志失败", e);
            throw new RuntimeException("批量插入日志失败", e);
        }
    }

    /**
     * 根据日志时间确定索引名
     * 支持按日期滚动索引，如 logs-2024.01.01
     */
    private String determineIndexName(LogEntry entry) {
        LocalDateTime timestamp = entry.getTimestamp();
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        
        String dateStr = String.format("%04d.%02d.%02d", 
            timestamp.getYear(), 
            timestamp.getMonthValue(), 
            timestamp.getDayOfMonth());
        
        return INDEX_PREFIX + dateStr;
    }

    /**
     * 获取查询用的索引名列表
     * 支持查询所有滚动索引（logs-*）和旧索引（logs）
     */
    private List<String> getQueryIndexNames() {
        List<String> indices = new ArrayList<>();
        indices.add(INDEX_PATTERN);  // 通配符查询所有日期索引
        indices.add(OLD_INDEX_NAME); // 兼容旧索引
        return indices;
    }

    /**
     * 按 ID 查询日志
     */
    public Optional<LogEntry> findById(String id) {
        return logEntryRepository.findById(id);
    }

    /**
     * 查询所有日志
     */
    public Iterable<LogEntry> findAll() {
        return logEntryRepository.findAll();
    }

    /**
     * 高级日志查询（支持多条件过滤）
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param keyword 关键词
     * @param level 日志级别
     * @param logType 日志类型
     * @param source 来源
     * @param pageable 分页参数
     * @return 分页结果
     */
    public Page<LogEntry> searchLogs(
            LocalDateTime startTime,
            LocalDateTime endTime,
            String keyword,
            String level,
            String logType,
            String source,
            Pageable pageable) {
        
        try {
            List<Query> queries = new ArrayList<>();

            // 时间范围查询
            if (startTime != null && endTime != null) {
                Query rangeQuery = RangeQuery.of(r -> r
                    .field("timestamp")
                    .gte(JsonData.of(startTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                    .lte(JsonData.of(endTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                )._toQuery();
                queries.add(rangeQuery);
            } else if (startTime != null) {
                Query rangeQuery = RangeQuery.of(r -> r
                    .field("timestamp")
                    .gte(JsonData.of(startTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                )._toQuery();
                queries.add(rangeQuery);
            } else if (endTime != null) {
                Query rangeQuery = RangeQuery.of(r -> r
                    .field("timestamp")
                    .lte(JsonData.of(endTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                )._toQuery();
                queries.add(rangeQuery);
            }

            // 关键词查询
            if (keyword != null && !keyword.trim().isEmpty()) {
                Query keywordQuery = MultiMatchQuery.of(m -> m
                    .fields("message", "rawLog", "fields.*")
                    .query(keyword)
                    .type(TextQueryType.BestFields)
                )._toQuery();
                queries.add(keywordQuery);
            }

            // 日志级别查询
            if (level != null && !level.trim().isEmpty()) {
                Query levelQuery = TermQuery.of(t -> t
                    .field("level")
                    .value(level.toUpperCase())
                )._toQuery();
                queries.add(levelQuery);
            }

            // 日志类型查询
            if (logType != null && !logType.trim().isEmpty()) {
                Query typeQuery = TermQuery.of(t -> t
                    .field("logType")
                    .value(logType.toLowerCase())
                )._toQuery();
                queries.add(typeQuery);
            }

            // 来源查询
            if (source != null && !source.trim().isEmpty()) {
                Query sourceQuery = TermQuery.of(t -> t
                    .field("source")
                    .value(source)
                )._toQuery();
                queries.add(sourceQuery);
            }

            // 构建查询
            Query finalQuery;
            if (queries.isEmpty()) {
                finalQuery = MatchAllQuery.of(m -> m)._toQuery();
            } else if (queries.size() == 1) {
                finalQuery = queries.get(0);
            } else {
                finalQuery = BoolQuery.of(b -> b
                    .must(queries)
                )._toQuery();
            }

            // 执行搜索
            SearchRequest searchRequest = new SearchRequest.Builder()
                .index(getQueryIndexNames())
                .query(finalQuery)
                .from((int) pageable.getOffset())
                .size(pageable.getPageSize())
                .sort(s -> s
                    .field(f -> f
                        .field("timestamp")
                        .order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)
                    )
                )
                .build();

            SearchResponse<Map> response = elasticsearchClient.search(searchRequest, Map.class);

            // 转换结果
            List<LogEntry> logEntries = new ArrayList<>();
            for (Hit<Map> hit : response.hits().hits()) {
                LogEntry entry = convertMapToLogEntry(hit.source());
                entry.setId(hit.id());
                logEntries.add(entry);
            }

            // 获取总数
            long total = 0;
            if (response.hits().total() != null) {
                total = response.hits().total().value();
            }

            return new PageImpl<>(logEntries, pageable, total);

        } catch (IOException e) {
            log.error("查询日志失败", e);
            throw new RuntimeException("查询日志失败", e);
        }
    }

    /**
     * 统计日志级别分布
     */
    public Map<String, Long> getLevelDistribution(
            LocalDateTime startTime,
            LocalDateTime endTime,
            String logType) {
        
        try {
            List<Query> filters = new ArrayList<>();
            
            // 时间范围
            if (startTime != null && endTime != null) {
                filters.add(RangeQuery.of(r -> r
                    .field("timestamp")
                    .gte(JsonData.of(startTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                    .lte(JsonData.of(endTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                )._toQuery());
            }

            // 日志类型
            if (logType != null && !logType.trim().isEmpty()) {
                filters.add(TermQuery.of(t -> t
                    .field("logType")
                    .value(logType.toLowerCase())
                )._toQuery());
            }

            SearchRequest request = new SearchRequest.Builder()
                .index(getQueryIndexNames())
                .query(filters.isEmpty() ? 
                    MatchAllQuery.of(m -> m)._toQuery() : 
                    BoolQuery.of(b -> b.filter(filters))._toQuery())
                .size(0)
                .aggregations("levels", a -> a
                    .terms(t -> t
                        .field("level")
                        .size(10)
                    )
                )
                .build();

            SearchResponse<Map> response = elasticsearchClient.search(request, Map.class);
            
            Map<String, Long> result = new LinkedHashMap<>();
            var agg = response.aggregations().get("levels").lterms();
            
            if (agg != null && agg.buckets() != null) {
                for (var bucket : agg.buckets().array()) {
                    result.put(bucket.key().stringValue(), bucket.docCount());
                }
            }

            return result;

        } catch (IOException e) {
            log.error("统计日志级别分布失败", e);
            throw new RuntimeException("统计日志级别分布失败", e);
        }
    }

    /**
     * 获取时间直方图数据
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param interval 时间间隔（例如：1h, 30m, 1d）
     * @param logType 日志类型
     * @return 时间点到数量的映射
     */
    public Map<String, Long> getTimeHistogram(
            LocalDateTime startTime,
            LocalDateTime endTime,
            String interval,
            String logType) {
        
        try {
            List<Query> filters = new ArrayList<>();
            
            // 时间范围
            if (startTime != null && endTime != null) {
                filters.add(RangeQuery.of(r -> r
                    .field("timestamp")
                    .gte(JsonData.of(startTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                    .lte(JsonData.of(endTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                )._toQuery());
            }

            // 日志类型
            if (logType != null && !logType.trim().isEmpty()) {
                filters.add(TermQuery.of(t -> t
                    .field("logType")
                    .value(logType.toLowerCase())
                )._toQuery());
            }

            SearchRequest request = new SearchRequest.Builder()
                .index(getQueryIndexNames())
                .query(filters.isEmpty() ? 
                    MatchAllQuery.of(m -> m)._toQuery() : 
                    BoolQuery.of(b -> b.filter(filters))._toQuery())
                .size(0)
                .aggregations("time_histogram", a -> a
                    .dateHistogram(d -> d
                        .field("timestamp")
                        .calendarInterval(convertInterval(interval))
                        .format("yyyy-MM-dd HH:mm:ss")
                        .minDocCount(0L)
                    )
                )
                .build();

            SearchResponse<Map> response = elasticsearchClient.search(request, Map.class);
            
            Map<String, Long> result = new LinkedHashMap<>();
            var agg = response.aggregations().get("time_histogram").dateHistogram();
            
            if (agg != null && agg.buckets() != null) {
                for (var bucket : agg.buckets().array()) {
                    result.put(bucket.keyAsString(), bucket.docCount());
                }
            }

            return result;

        } catch (IOException e) {
            log.error("获取时间直方图失败", e);
            throw new RuntimeException("获取时间直方图失败", e);
        }
    }

    /**
     * 获取 Top N 错误消息
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param topN 返回前 N 条
     * @param logType 日志类型
     * @return 错误消息列表
     */
    public List<Map<String, Object>> getTopErrorMessages(
            LocalDateTime startTime,
            LocalDateTime endTime,
            int topN,
            String logType) {
        
        try {
            List<Query> filters = new ArrayList<>();
            
            // 时间范围
            if (startTime != null && endTime != null) {
                filters.add(RangeQuery.of(r -> r
                    .field("timestamp")
                    .gte(JsonData.of(startTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                    .lte(JsonData.of(endTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                )._toQuery());
            }

            // 日志类型
            if (logType != null && !logType.trim().isEmpty()) {
                filters.add(TermQuery.of(t -> t
                    .field("logType")
                    .value(logType.toLowerCase())
                )._toQuery());
            }

            // 只查询 ERROR 级别
            filters.add(TermQuery.of(t -> t
                .field("level")
                .value("ERROR")
            )._toQuery());

            SearchRequest request = new SearchRequest.Builder()
                .index(getQueryIndexNames())
                .query(BoolQuery.of(b -> b.filter(filters))._toQuery())
                .size(topN)
                .sort(s -> s
                    .field(f -> f
                        .field("timestamp")
                        .order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)
                    )
                )
                .build();

            SearchResponse<Map> response = elasticsearchClient.search(request, Map.class);
            
            List<Map<String, Object>> result = new ArrayList<>();
            for (Hit<Map> hit : response.hits().hits()) {
                Map<String, Object> entry = new HashMap<>();
                Map source = hit.source();
                entry.put("message", source.get("message"));
                entry.put("timestamp", source.get("timestamp"));
                entry.put("source", source.get("source"));
                entry.put("logType", source.get("logType"));
                result.add(entry);
            }

            return result;

        } catch (IOException e) {
            log.error("获取 Top 错误消息失败", e);
            throw new RuntimeException("获取 Top 错误消息失败", e);
        }
    }

    /**
     * 获取日志总数
     */
    public long countAll() {
        return logEntryRepository.count();
    }

    /**
     * 按条件统计数量
     */
    public long countByCondition(
            LocalDateTime startTime,
            LocalDateTime endTime,
            String level,
            String logType) {
        
        try {
            List<Query> filters = new ArrayList<>();
            
            if (startTime != null && endTime != null) {
                filters.add(RangeQuery.of(r -> r
                    .field("timestamp")
                    .gte(JsonData.of(startTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                    .lte(JsonData.of(endTime.atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT)))
                )._toQuery());
            }

            if (level != null && !level.trim().isEmpty()) {
                filters.add(TermQuery.of(t -> t
                    .field("level")
                    .value(level.toUpperCase())
                )._toQuery());
            }

            if (logType != null && !logType.trim().isEmpty()) {
                filters.add(TermQuery.of(t -> t
                    .field("logType")
                    .value(logType.toLowerCase())
                )._toQuery());
            }

            SearchRequest request = new SearchRequest.Builder()
                .index(getQueryIndexNames())
                .query(filters.isEmpty() ? 
                    MatchAllQuery.of(m -> m)._toQuery() : 
                    BoolQuery.of(b -> b.filter(filters))._toQuery())
                .size(0)
                .build();

            SearchResponse<Map> response = elasticsearchClient.search(request, Map.class);
            
            if (response.hits().total() != null) {
                return response.hits().total().value();
            }
            return 0;

        } catch (IOException e) {
            log.error("统计日志数量失败", e);
            throw new RuntimeException("统计日志数量失败", e);
        }
    }

    /**
     * 转换 LogEntry 为 Map
     */
    private Map<String, Object> convertLogEntryToMap(LogEntry entry) {
        Map<String, Object> map = new HashMap<>();
        
        map.put("timestamp", entry.getTimestamp() != null ? 
            entry.getTimestamp().atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT) : null);
        map.put("level", entry.getLevel());
        map.put("message", entry.getMessage());
        map.put("rawLog", entry.getRawLog());
        map.put("source", entry.getSource());
        map.put("logType", entry.getLogType());
        map.put("fields", entry.getFields());
        map.put("createdAt", entry.getCreatedAt() != null ? 
            entry.getCreatedAt().atZone(ZoneId.systemDefault()).format(ES_DATE_FORMAT) : null);
        
        return map;
    }

    /**
     * 转换 Map 为 LogEntry
     */
    private LogEntry convertMapToLogEntry(Map<String, Object> map) {
        LogEntry entry = new LogEntry();
        
        if (map.get("timestamp") != null) {
            try {
                String timeStr = map.get("timestamp").toString().replaceAll("Z$", "");
                entry.setTimestamp(LocalDateTime.parse(timeStr, ES_DATE_FORMAT));
            } catch (Exception e) {
                log.warn("解析时间戳失败: {}", map.get("timestamp"));
            }
        }
        
        entry.setLevel(map.get("level") != null ? map.get("level").toString() : null);
        entry.setMessage(map.get("message") != null ? map.get("message").toString() : null);
        entry.setRawLog(map.get("rawLog") != null ? map.get("rawLog").toString() : null);
        entry.setSource(map.get("source") != null ? map.get("source").toString() : null);
        entry.setLogType(map.get("logType") != null ? map.get("logType").toString() : null);
        entry.setFields(map.get("fields") != null ? (Map<String, Object>) map.get("fields") : new HashMap<>());
        
        if (map.get("createdAt") != null) {
            try {
                String timeStr = map.get("createdAt").toString().replaceAll("Z$", "");
                entry.setCreatedAt(LocalDateTime.parse(timeStr, ES_DATE_FORMAT));
            } catch (Exception e) {
                log.warn("解析创建时间失败: {}", map.get("createdAt"));
            }
        }
        
        return entry;
    }

    /**
     * 转换时间间隔格式
     */
    private co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval convertInterval(String interval) {
        if (interval == null) {
            return co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval.Hour;
        }
        
        return switch (interval.toLowerCase()) {
            case "1m", "minute" -> co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval.Minute;
            case "5m" -> co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval._5m;
            case "30m" -> co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval._30m;
            case "1h", "hour" -> co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval.Hour;
            case "1d", "day" -> co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval.Day;
            case "1w", "week" -> co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval.Week;
            case "1M", "month" -> co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval.Month;
            case "1y", "year" -> co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval.Year;
            default -> co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval.Hour;
        };
    }
}
