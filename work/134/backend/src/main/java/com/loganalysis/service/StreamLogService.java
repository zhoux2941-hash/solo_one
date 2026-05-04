package com.loganalysis.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import co.elastic.clients.elasticsearch.core.bulk.BulkOperation;
import com.loganalysis.entity.LogEntry;
import com.loganalysis.entity.ParseRule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 流式日志处理服务
 * 用于大文件上传时的流式读取、解析和存储，避免 OOM
 */
@Service
@Slf4j
public class StreamLogService {

    @Autowired
    private LogParserService logParserService;

    @Autowired
    private ElasticsearchClient elasticsearchClient;

    @Value("${log.upload.batch-size:1000}")
    private int batchSize;

    private static final DateTimeFormatter ES_DATE_FORMAT = DateTimeFormatter.ISO_DATE_TIME;
    
    // 使用通配符索引，支持日志滚动索引如 logs-2024.01.01, logs-2024.01.02 等
    // 写入时使用带日期的索引，查询时使用通配符
    private static final String INDEX_PREFIX = "logs-";

    /**
     * 流式处理日志文件
     * 逐行读取，分批次解析和存储，避免 OOM
     *
     * @param inputStream 输入流
     * @param logType 日志类型
     * @param parseRule 解析规则（可选）
     * @param source 来源标识
     * @return 处理结果统计
     */
    public StreamProcessResult streamProcessLog(
            InputStream inputStream,
            String logType,
            ParseRule parseRule,
            String source) {
        
        AtomicInteger totalLines = new AtomicInteger(0);
        AtomicInteger parsedCount = new AtomicInteger(0);
        AtomicInteger savedCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);
        AtomicLong bytesRead = new AtomicLong(0);
        
        List<LogEntry> batchBuffer = new ArrayList<>(batchSize);
        
        long startTime = System.currentTimeMillis();
        
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            
            String line;
            while ((line = reader.readLine()) != null) {
                totalLines.incrementAndGet();
                bytesRead.addAndGet(line.getBytes(StandardCharsets.UTF_8).length + 1);
                
                // 跳过空行
                if (line.trim().isEmpty()) {
                    continue;
                }
                
                try {
                    // 解析单条日志
                    LogEntry entry = logParserService.parseLogLine(line, logType, parseRule);
                    
                    // 设置来源
                    if (entry.getSource() == null && source != null) {
                        entry.setSource(source);
                    }
                    
                    parsedCount.incrementAndGet();
                    batchBuffer.add(entry);
                    
                    // 达到批量大小时提交
                    if (batchBuffer.size() >= batchSize) {
                        int saved = flushBatch(batchBuffer);
                        savedCount.addAndGet(saved);
                        batchBuffer.clear();
                        
                        // 输出进度日志
                        log.info("流式处理进度: 已处理 {} 行, 解析成功 {} 行, 保存成功 {} 行", 
                            totalLines.get(), parsedCount.get(), savedCount.get());
                    }
                    
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                    log.debug("解析日志行失败: {}", line, e);
                }
            }
            
            // 处理最后一批
            if (!batchBuffer.isEmpty()) {
                int saved = flushBatch(batchBuffer);
                savedCount.addAndGet(saved);
                batchBuffer.clear();
            }
            
        } catch (IOException e) {
            log.error("读取日志流失败", e);
            throw new RuntimeException("读取日志失败: " + e.getMessage(), e);
        }
        
        long duration = System.currentTimeMillis() - startTime;
        
        StreamProcessResult result = new StreamProcessResult();
        result.setTotalLines(totalLines.get());
        result.setParsedCount(parsedCount.get());
        result.setSavedCount(savedCount.get());
        result.setErrorCount(errorCount.get());
        result.setBytesRead(bytesRead.get());
        result.setDurationMs(duration);
        result.setLogType(logType);
        result.setSource(source);
        
        log.info("流式处理完成: 总行数={}, 解析成功={}, 保存成功={}, 失败={}, 耗时={}ms", 
            totalLines.get(), parsedCount.get(), savedCount.get(), errorCount.get(), duration);
        
        return result;
    }

    /**
     * 分批提交到 Elasticsearch
     */
    private int flushBatch(List<LogEntry> batch) {
        if (batch == null || batch.isEmpty()) {
            return 0;
        }
        
        try {
            List<BulkOperation> operations = new ArrayList<>(batch.size());
            
            for (LogEntry entry : batch) {
                // 根据日志时间确定索引名，支持按天滚动
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

            return successCount;

        } catch (IOException e) {
            log.error("批量插入日志失败", e);
            return 0;
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
        
        // 格式: logs-2024.01.01
        String dateStr = String.format("%04d.%02d.%02d", 
            timestamp.getYear(), 
            timestamp.getMonthValue(), 
            timestamp.getDayOfMonth());
        
        return INDEX_PREFIX + dateStr;
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
     * 流式处理结果
     */
    public static class StreamProcessResult {
        private int totalLines;
        private int parsedCount;
        private int savedCount;
        private int errorCount;
        private long bytesRead;
        private long durationMs;
        private String logType;
        private String source;

        public int getTotalLines() { return totalLines; }
        public void setTotalLines(int totalLines) { this.totalLines = totalLines; }
        public int getParsedCount() { return parsedCount; }
        public void setParsedCount(int parsedCount) { this.parsedCount = parsedCount; }
        public int getSavedCount() { return savedCount; }
        public void setSavedCount(int savedCount) { this.savedCount = savedCount; }
        public int getErrorCount() { return errorCount; }
        public void setErrorCount(int errorCount) { this.errorCount = errorCount; }
        public long getBytesRead() { return bytesRead; }
        public void setBytesRead(long bytesRead) { this.bytesRead = bytesRead; }
        public long getDurationMs() { return durationMs; }
        public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
        public String getLogType() { return logType; }
        public void setLogType(String logType) { this.logType = logType; }
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        
        public double getSpeedMBps() {
            if (durationMs == 0) return 0;
            return (bytesRead / 1024.0 / 1024.0) / (durationMs / 1000.0);
        }
    }
}
