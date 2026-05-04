package com.loganalysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.loganalysis.entity.LogEntry;
import com.loganalysis.entity.ParseRule;
import io.krakens.grok.api.Grok;
import io.krakens.grok.api.GrokCompiler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 日志解析服务
 * 支持 nginx、apache、json lines 等多种日志格式
 */
@Service
@Slf4j
public class LogParserService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // 标准 Nginx 日志格式
    private static final Pattern NGINX_ACCESS_LOG_PATTERN = Pattern.compile(
        "^(\\S+) (\\S+) (\\S+) \\[([^\\]]+)\\] \"(\\S+) (\\S+) (\\S+)\" (\\d+) (\\d+) \"([^\"]*)\" \"([^\"]*)\"$"
    );
    
    // 标准 Apache 通用日志格式
    private static final Pattern APACHE_COMMON_LOG_PATTERN = Pattern.compile(
        "^(\\S+) (\\S+) (\\S+) \\[([^\\]]+)\\] \"(\\S+) (\\S+) (\\S+)\" (\\d+) (\\d+)$"
    );
    
    // 标准 Apache 组合日志格式
    private static final Pattern APACHE_COMBINED_LOG_PATTERN = Pattern.compile(
        "^(\\S+) (\\S+) (\\S+) \\[([^\\]]+)\\] \"(\\S+) (\\S+) (\\S+)\" (\\d+) (\\d+) \"([^\"]*)\" \"([^\"]*)\"$"
    );
    
    // 日期时间格式化器
    private static final DateTimeFormatter NGINX_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MMM/yyyy:HH:mm:ss Z", Locale.ENGLISH);
    private static final DateTimeFormatter ISO_DATE_FORMAT = DateTimeFormatter.ISO_DATE_TIME;

    /**
     * 解析单条日志
     * @param logLine 原始日志行
     * @param logType 日志类型
     * @param parseRule 解析规则（可选，用于自定义规则）
     * @return 解析后的日志条目
     */
    public LogEntry parseLogLine(String logLine, String logType, ParseRule parseRule) {
        LogEntry logEntry = new LogEntry();
        logEntry.setRawLog(logLine);
        logEntry.setLogType(logType);
        logEntry.setCreatedAt(LocalDateTime.now());
        
        try {
            switch (logType.toLowerCase()) {
                case "nginx":
                    parseNginxLog(logEntry, logLine);
                    break;
                case "apache":
                    parseApacheLog(logEntry, logLine);
                    break;
                case "json_lines":
                    parseJsonLinesLog(logEntry, logLine);
                    break;
                case "custom":
                    if (parseRule != null) {
                        parseCustomLog(logEntry, logLine, parseRule);
                    } else {
                        log.warn("未提供自定义解析规则，使用原始日志");
                        setDefaultLogEntry(logEntry);
                    }
                    break;
                default:
                    // 尝试自动检测格式
                    if (!tryAutoDetectAndParse(logEntry, logLine)) {
                        setDefaultLogEntry(logEntry);
                    }
            }
        } catch (Exception e) {
            log.error("解析日志失败: {}", logLine, e);
            setDefaultLogEntry(logEntry);
        }
        
        return logEntry;
    }

    /**
     * 批量解析日志
     * @param logLines 日志行列表
     * @param logType 日志类型
     * @param parseRule 解析规则
     * @return 解析后的日志条目列表
     */
    public List<LogEntry> parseLogLines(List<String> logLines, String logType, ParseRule parseRule) {
        List<LogEntry> entries = new ArrayList<>();
        
        for (String line : logLines) {
            if (line.trim().isEmpty()) {
                continue;
            }
            
            LogEntry entry = parseLogLine(line, logType, parseRule);
            entries.add(entry);
        }
        
        return entries;
    }

    /**
     * 解析 Nginx 日志
     */
    private void parseNginxLog(LogEntry entry, String logLine) {
        Matcher matcher = NGINX_ACCESS_LOG_PATTERN.matcher(logLine);
        
        if (matcher.matches()) {
            Map<String, Object> fields = new HashMap<>();
            
            fields.put("remoteAddr", matcher.group(1));
            fields.put("remoteUser", matcher.group(2));
            fields.put("remoteLogname", matcher.group(3));
            
            // 解析时间戳
            String timeStr = matcher.group(4);
            try {
                entry.setTimestamp(parseNginxTimestamp(timeStr));
            } catch (DateTimeParseException e) {
                entry.setTimestamp(LocalDateTime.now());
            }
            
            fields.put("method", matcher.group(5));
            fields.put("request", matcher.group(6));
            fields.put("protocol", matcher.group(7));
            fields.put("status", matcher.group(8));
            fields.put("bodyBytesSent", matcher.group(9));
            fields.put("httpReferer", matcher.group(10));
            fields.put("httpUserAgent", matcher.group(11));
            
            entry.setFields(fields);
            entry.setLevel(determineLevelFromStatus(matcher.group(8)));
            entry.setMessage(matcher.group(5) + " " + matcher.group(6));
        } else {
            setDefaultLogEntry(entry);
        }
    }

    /**
     * 解析 Apache 日志
     */
    private void parseApacheLog(LogEntry entry, String logLine) {
        // 尝试组合格式
        Matcher combinedMatcher = APACHE_COMBINED_LOG_PATTERN.matcher(logLine);
        if (combinedMatcher.matches()) {
            Map<String, Object> fields = new HashMap<>();
            
            fields.put("remoteAddr", combinedMatcher.group(1));
            fields.put("remoteLogname", combinedMatcher.group(2));
            fields.put("remoteUser", combinedMatcher.group(3));
            
            String timeStr = combinedMatcher.group(4);
            try {
                entry.setTimestamp(parseNginxTimestamp(timeStr));
            } catch (DateTimeParseException e) {
                entry.setTimestamp(LocalDateTime.now());
            }
            
            fields.put("method", combinedMatcher.group(5));
            fields.put("request", combinedMatcher.group(6));
            fields.put("protocol", combinedMatcher.group(7));
            fields.put("status", combinedMatcher.group(8));
            fields.put("bodyBytesSent", combinedMatcher.group(9));
            fields.put("httpReferer", combinedMatcher.group(10));
            fields.put("httpUserAgent", combinedMatcher.group(11));
            
            entry.setFields(fields);
            entry.setLevel(determineLevelFromStatus(combinedMatcher.group(8)));
            entry.setMessage(combinedMatcher.group(5) + " " + combinedMatcher.group(6));
            return;
        }
        
        // 尝试通用格式
        Matcher commonMatcher = APACHE_COMMON_LOG_PATTERN.matcher(logLine);
        if (commonMatcher.matches()) {
            Map<String, Object> fields = new HashMap<>();
            
            fields.put("remoteAddr", commonMatcher.group(1));
            fields.put("remoteLogname", commonMatcher.group(2));
            fields.put("remoteUser", commonMatcher.group(3));
            
            String timeStr = commonMatcher.group(4);
            try {
                entry.setTimestamp(parseNginxTimestamp(timeStr));
            } catch (DateTimeParseException e) {
                entry.setTimestamp(LocalDateTime.now());
            }
            
            fields.put("method", commonMatcher.group(5));
            fields.put("request", commonMatcher.group(6));
            fields.put("protocol", commonMatcher.group(7));
            fields.put("status", commonMatcher.group(8));
            fields.put("bodyBytesSent", commonMatcher.group(9));
            
            entry.setFields(fields);
            entry.setLevel(determineLevelFromStatus(commonMatcher.group(8)));
            entry.setMessage(commonMatcher.group(5) + " " + commonMatcher.group(6));
            return;
        }
        
        setDefaultLogEntry(entry);
    }

    /**
     * 解析 JSON Lines 格式日志
     */
    private void parseJsonLinesLog(LogEntry entry, String logLine) {
        try {
            JsonNode jsonNode = objectMapper.readTree(logLine);
            Map<String, Object> fields = new HashMap<>();
            
            // 尝试提取常见字段
            if (jsonNode.has("timestamp") || jsonNode.has("@timestamp")) {
                String timeField = jsonNode.has("timestamp") ? "timestamp" : "@timestamp";
                String timeStr = jsonNode.get(timeField).asText();
                try {
                    entry.setTimestamp(LocalDateTime.parse(timeStr.replaceAll("Z$", ""), ISO_DATE_FORMAT));
                } catch (Exception e) {
                    entry.setTimestamp(LocalDateTime.now());
                }
            } else {
                entry.setTimestamp(LocalDateTime.now());
            }
            
            if (jsonNode.has("level") || jsonNode.has("log.level")) {
                String levelField = jsonNode.has("level") ? "level" : "log.level";
                entry.setLevel(jsonNode.get(levelField).asText().toUpperCase());
            } else {
                entry.setLevel("INFO");
            }
            
            if (jsonNode.has("message") || jsonNode.has("msg")) {
                String msgField = jsonNode.has("message") ? "message" : "msg";
                entry.setMessage(jsonNode.get(msgField).asText());
            } else {
                entry.setMessage(logLine);
            }
            
            // 将所有字段存储到 fields 中
            Iterator<Map.Entry<String, JsonNode>> fieldsIter = jsonNode.fields();
            while (fieldsIter.hasNext()) {
                Map.Entry<String, JsonNode> fieldEntry = fieldsIter.next();
                String key = fieldEntry.getKey();
                JsonNode value = fieldEntry.getValue();
                
                if (value.isTextual()) {
                    fields.put(key, value.asText());
                } else if (value.isNumber()) {
                    fields.put(key, value.numberValue());
                } else if (value.isBoolean()) {
                    fields.put(key, value.asBoolean());
                } else if (!value.isObject() && !value.isArray()) {
                    fields.put(key, value.toString());
                }
            }
            
            entry.setFields(fields);
            
        } catch (Exception e) {
            log.error("解析 JSON 日志失败: {}", logLine, e);
            setDefaultLogEntry(entry);
        }
    }

    /**
     * 使用自定义规则解析日志
     */
    private void parseCustomLog(LogEntry entry, String logLine, ParseRule parseRule) {
        Map<String, Object> fields = new HashMap<>();
        
        if ("regex".equalsIgnoreCase(parseRule.getRuleType())) {
            // 使用正则表达式解析
            Pattern pattern = Pattern.compile(parseRule.getPattern());
            Matcher matcher = pattern.matcher(logLine);
            
            if (matcher.matches()) {
                // 解析字段映射
                Map<String, String> fieldMapping = parseFieldMapping(parseRule.getFieldMapping());
                
                for (int i = 1; i <= matcher.groupCount(); i++) {
                    String fieldName = fieldMapping.getOrDefault("group" + i, "field" + i);
                    fields.put(fieldName, matcher.group(i));
                }
                
                // 提取标准字段
                extractStandardFields(entry, fields, fieldMapping);
            } else {
                setDefaultLogEntry(entry);
                return;
            }
            
        } else if ("grok".equalsIgnoreCase(parseRule.getRuleType())) {
            // 使用 Grok 模式解析
            try {
                GrokCompiler grokCompiler = GrokCompiler.newInstance();
                grokCompiler.registerDefaultPatterns();
                Grok grok = grokCompiler.compile(parseRule.getPattern());
                
                Map<String, Object> grokResult = grok.capture(logLine);
                
                if (grokResult != null && !grokResult.isEmpty()) {
                    // 解析字段映射
                    Map<String, String> fieldMapping = parseFieldMapping(parseRule.getFieldMapping());
                    
                    for (Map.Entry<String, Object> grokEntry : grokResult.entrySet()) {
                        String fieldName = fieldMapping.getOrDefault(grokEntry.getKey(), grokEntry.getKey());
                        fields.put(fieldName, grokEntry.getValue());
                    }
                    
                    // 提取标准字段
                    extractStandardFields(entry, fields, fieldMapping);
                } else {
                    setDefaultLogEntry(entry);
                    return;
                }
                
            } catch (Exception e) {
                log.error("Grok 解析失败: {}", logLine, e);
                setDefaultLogEntry(entry);
                return;
            }
        }
        
        entry.setFields(fields);
    }

    /**
     * 尝试自动检测并解析日志格式
     */
    private boolean tryAutoDetectAndParse(LogEntry entry, String logLine) {
        // 尝试 JSON 格式
        if (logLine.trim().startsWith("{") && logLine.trim().endsWith("}")) {
            parseJsonLinesLog(entry, logLine);
            return true;
        }
        
        // 尝试 Nginx 格式
        if (NGINX_ACCESS_LOG_PATTERN.matcher(logLine).matches()) {
            parseNginxLog(entry, logLine);
            entry.setLogType("nginx");
            return true;
        }
        
        // 尝试 Apache 格式
        if (APACHE_COMBINED_LOG_PATTERN.matcher(logLine).matches() || 
            APACHE_COMMON_LOG_PATTERN.matcher(logLine).matches()) {
            parseApacheLog(entry, logLine);
            entry.setLogType("apache");
            return true;
        }
        
        // 尝试检测日志级别
        String level = detectLogLevel(logLine);
        if (level != null) {
            entry.setLevel(level);
            entry.setMessage(logLine);
            entry.setTimestamp(LocalDateTime.now());
            return true;
        }
        
        return false;
    }

    /**
     * 检测日志级别
     */
    private String detectLogLevel(String logLine) {
        String upperLine = logLine.toUpperCase();
        
        if (upperLine.contains("ERROR") || upperLine.contains("FATAL")) {
            return "ERROR";
        } else if (upperLine.contains("WARN")) {
            return "WARN";
        } else if (upperLine.contains("INFO")) {
            return "INFO";
        } else if (upperLine.contains("DEBUG")) {
            return "DEBUG";
        } else if (upperLine.contains("TRACE")) {
            return "TRACE";
        }
        
        return null;
    }

    /**
     * 从 HTTP 状态码确定日志级别
     */
    private String determineLevelFromStatus(String status) {
        if (status == null) return "INFO";
        
        try {
            int statusCode = Integer.parseInt(status);
            
            if (statusCode >= 500) {
                return "ERROR";
            } else if (statusCode >= 400) {
                return "WARN";
            } else {
                return "INFO";
            }
        } catch (NumberFormatException e) {
            return "INFO";
        }
    }

    /**
     * 解析 Nginx 格式的时间戳
     */
    private LocalDateTime parseNginxTimestamp(String timeStr) {
        // Nginx 格式: 01/Jan/2024:12:34:56 +0000
        return LocalDateTime.parse(timeStr, NGINX_DATE_FORMAT);
    }

    /**
     * 解析字段映射 JSON
     */
    private Map<String, String> parseFieldMapping(String fieldMappingJson) {
        Map<String, String> mapping = new HashMap<>();
        
        if (fieldMappingJson == null || fieldMappingJson.isEmpty()) {
            return mapping;
        }
        
        try {
            JsonNode jsonNode = objectMapper.readTree(fieldMappingJson);
            Iterator<Map.Entry<String, JsonNode>> fields = jsonNode.fields();
            
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                mapping.put(entry.getKey(), entry.getValue().asText());
            }
        } catch (Exception e) {
            log.warn("解析字段映射失败: {}", fieldMappingJson, e);
        }
        
        return mapping;
    }

    /**
     * 从字段中提取标准字段（timestamp, level, message）
     */
    private void extractStandardFields(LogEntry entry, Map<String, Object> fields, Map<String, String> fieldMapping) {
        // 提取时间戳
        if (fields.containsKey("timestamp")) {
            try {
                String timeStr = fields.get("timestamp").toString();
                entry.setTimestamp(LocalDateTime.parse(timeStr.replaceAll("Z$", ""), ISO_DATE_FORMAT));
            } catch (Exception e) {
                entry.setTimestamp(LocalDateTime.now());
            }
        } else {
            entry.setTimestamp(LocalDateTime.now());
        }
        
        // 提取日志级别
        if (fields.containsKey("level")) {
            entry.setLevel(fields.get("level").toString().toUpperCase());
        } else {
            entry.setLevel("INFO");
        }
        
        // 提取消息
        if (fields.containsKey("message")) {
            entry.setMessage(fields.get("message").toString());
        } else if (fields.containsKey("msg")) {
            entry.setMessage(fields.get("msg").toString());
        } else {
            entry.setMessage(entry.getRawLog());
        }
    }

    /**
     * 设置默认的日志条目
     */
    private void setDefaultLogEntry(LogEntry entry) {
        entry.setTimestamp(LocalDateTime.now());
        entry.setLevel(detectLogLevel(entry.getRawLog()));
        if (entry.getLevel() == null) {
            entry.setLevel("INFO");
        }
        entry.setMessage(entry.getRawLog());
        entry.setFields(new HashMap<>());
    }
}
