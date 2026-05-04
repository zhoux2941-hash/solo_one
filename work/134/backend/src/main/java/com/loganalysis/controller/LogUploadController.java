package com.loganalysis.controller;

import com.loganalysis.dto.ApiResponse;
import com.loganalysis.dto.LogUploadRequest;
import com.loganalysis.entity.LogEntry;
import com.loganalysis.entity.ParseRule;
import com.loganalysis.service.LogParserService;
import com.loganalysis.service.LogService;
import com.loganalysis.service.ParseRuleService;
import com.loganalysis.service.StreamLogService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * 日志上传和解析控制器
 * 优化：支持大文件流式处理，避免 OOM
 */
@RestController
@RequestMapping("/api/logs")
@CrossOrigin(origins = "*")
@Slf4j
public class LogUploadController {

    @Autowired
    private LogParserService logParserService;

    @Autowired
    private LogService logService;

    @Autowired
    private ParseRuleService parseRuleService;

    @Autowired
    private StreamLogService streamLogService;

    // 大文件阈值（10MB），超过此阈值使用流式处理
    private static final long LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;

    /**
     * 上传并解析单文件日志
     * 优化：根据文件大小自动选择处理方式，大文件使用流式处理避免 OOM
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> uploadLogFile(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "logType", defaultValue = "auto") String logType,
            @RequestParam(value = "parseRuleId", required = false) Long parseRuleId,
            @RequestParam(value = "source", required = false) String source,
            @RequestParam(value = "forceStream", defaultValue = "false") Boolean forceStream) {
        
        log.info("上传日志文件: {}, 大小: {} bytes, 类型: {}, 规则ID: {}", 
            file.getOriginalFilename(), file.getSize(), logType, parseRuleId);
        
        try {
            // 获取解析规则
            ParseRule parseRule = null;
            if (parseRuleId != null) {
                Optional<ParseRule> ruleOpt = parseRuleService.getRuleById(parseRuleId);
                if (ruleOpt.isEmpty()) {
                    return ApiResponse.error("解析规则不存在: " + parseRuleId);
                }
                parseRule = ruleOpt.get();
                logType = parseRule.getLogType();
            }
            
            // 设置来源
            String logSource = source != null ? source : 
                (file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload");

            Map<String, Object> result;
            
            // 判断是否使用流式处理：大文件或强制流式
            boolean useStream = forceStream || file.getSize() > LARGE_FILE_THRESHOLD;
            
            if (useStream) {
                log.info("使用流式处理模式处理大文件: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
                result = processWithStream(file.getInputStream(), logType, parseRule, logSource);
            } else {
                log.info("使用常规处理模式处理小文件: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
                result = processWithMemory(file, logType, parseRule, logSource);
            }
            
            result.put("processingMode", useStream ? "stream" : "memory");
            result.put("fileSize", file.getSize());
            
            log.info("日志上传完成: 总行数={}, 解析成功={}, 保存成功={}", 
                result.get("totalLines"), result.get("parsedCount"), result.get("savedCount"));
            
            return ApiResponse.success("日志上传成功", result);
            
        } catch (IOException e) {
            log.error("读取日志文件失败", e);
            return ApiResponse.error("读取文件失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("上传日志失败", e);
            return ApiResponse.error("上传失败: " + e.getMessage());
        }
    }

    /**
     * 流式处理（大文件）
     */
    private Map<String, Object> processWithStream(
            InputStream inputStream,
            String logType,
            ParseRule parseRule,
            String source) throws IOException {
        
        StreamLogService.StreamProcessResult result = 
            streamLogService.streamProcessLog(inputStream, logType, parseRule, source);
        
        Map<String, Object> map = new HashMap<>();
        map.put("totalLines", result.getTotalLines());
        map.put("parsedCount", result.getParsedCount());
        map.put("savedCount", result.getSavedCount());
        map.put("errorCount", result.getErrorCount());
        map.put("bytesRead", result.getBytesRead());
        map.put("durationMs", result.getDurationMs());
        map.put("speedMBps", String.format("%.2f", result.getSpeedMBps()));
        map.put("logType", result.getLogType());
        map.put("source", result.getSource());
        
        return map;
    }

    /**
     * 内存处理（小文件）- 保持原有逻辑
     */
    private Map<String, Object> processWithMemory(
            MultipartFile file,
            String logType,
            ParseRule parseRule,
            String source) throws IOException {
        
        String content = IOUtils.toString(file.getInputStream(), StandardCharsets.UTF_8);
        List<String> lines = Arrays.asList(content.split("\\r?\\n"));
        
        // 解析日志
        List<LogEntry> entries = logParserService.parseLogLines(lines, logType, parseRule);
        
        // 设置来源
        for (LogEntry entry : entries) {
            if (entry.getSource() == null) {
                entry.setSource(source);
            }
        }
        
        // 批量保存到 Elasticsearch
        int savedCount = logService.bulkSaveLogEntries(entries);
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalLines", lines.size());
        result.put("parsedCount", entries.size());
        result.put("savedCount", savedCount);
        result.put("errorCount", lines.size() - entries.size());
        result.put("logType", logType);
        result.put("source", source);
        
        return result;
    }

    /**
     * 批量上传多个日志文件
     * 优化：每个文件独立处理，大文件自动使用流式处理
     */
    @PostMapping(value = "/upload/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> uploadMultipleLogFiles(
            @RequestPart("files") MultipartFile[] files,
            @RequestParam(value = "logType", defaultValue = "auto") String logType,
            @RequestParam(value = "parseRuleId", required = false) Long parseRuleId) {
        
        log.info("批量上传日志文件: {} 个文件", files.length);
        
        try {
            long totalBytes = 0;
            for (MultipartFile file : files) {
                totalBytes += file.getSize();
            }
            
            int totalLines = 0;
            int totalParsed = 0;
            int totalSaved = 0;
            int totalErrors = 0;
            List<Map<String, Object>> fileResults = new ArrayList<>();
            
            // 获取解析规则
            ParseRule parseRule = null;
            if (parseRuleId != null) {
                Optional<ParseRule> ruleOpt = parseRuleService.getRuleById(parseRuleId);
                if (ruleOpt.isEmpty()) {
                    return ApiResponse.error("解析规则不存在: " + parseRuleId);
                }
                parseRule = ruleOpt.get();
            }
            
            for (MultipartFile file : files) {
                try {
                    String currentLogType = logType;
                    if (parseRule != null) {
                        currentLogType = parseRule.getLogType();
                    }
                    
                    String source = file.getOriginalFilename() != null ? 
                        file.getOriginalFilename() : "upload_" + UUID.randomUUID();
                    
                    Map<String, Object> fileResult;
                    
                    // 大文件使用流式处理
                    if (file.getSize() > LARGE_FILE_THRESHOLD) {
                        log.info("批量上传中使用流式处理文件: {} ({} bytes)", 
                            file.getOriginalFilename(), file.getSize());
                        fileResult = processWithStream(file.getInputStream(), currentLogType, parseRule, source);
                    } else {
                        fileResult = processWithMemory(file, currentLogType, parseRule, source);
                    }
                    
                    fileResult.put("fileName", file.getOriginalFilename());
                    fileResult.put("fileSize", file.getSize());
                    
                    fileResults.add(fileResult);
                    
                    totalLines += (Integer) fileResult.getOrDefault("totalLines", 0);
                    totalParsed += (Integer) fileResult.getOrDefault("parsedCount", 0);
                    totalSaved += (Integer) fileResult.getOrDefault("savedCount", 0);
                    totalErrors += (Integer) fileResult.getOrDefault("errorCount", 0);
                    
                } catch (Exception e) {
                    log.error("处理文件失败: {}", file.getOriginalFilename(), e);
                    
                    Map<String, Object> fileResult = new HashMap<>();
                    fileResult.put("fileName", file.getOriginalFilename());
                    fileResult.put("error", e.getMessage());
                    fileResults.add(fileResult);
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalFiles", files.length);
            result.put("totalBytes", totalBytes);
            result.put("totalLines", totalLines);
            result.put("totalParsed", totalParsed);
            result.put("totalSaved", totalSaved);
            result.put("totalErrors", totalErrors);
            result.put("fileResults", fileResults);
            
            log.info("批量上传完成: 总文件={}, 总字节={}, 总行数={}, 解析成功={}, 保存成功={}", 
                files.length, totalBytes, totalLines, totalParsed, totalSaved);
            
            return ApiResponse.success("批量上传完成", result);
            
        } catch (Exception e) {
            log.error("批量上传失败", e);
            return ApiResponse.error("批量上传失败: " + e.getMessage());
        }
    }

    /**
     * 大文件分块上传 - 初始化上传会话
     */
    @PostMapping("/upload/chunk/init")
    public ApiResponse<Map<String, Object>> initChunkUpload(
            @RequestBody Map<String, Object> request) {
        
        String fileName = (String) request.get("fileName");
        Long fileSize = request.get("fileSize") != null ? 
            ((Number) request.get("fileSize")).longValue() : 0L;
        String logType = (String) request.getOrDefault("logType", "auto");
        Long parseRuleId = request.get("parseRuleId") != null ? 
            ((Number) request.get("parseRuleId")).longValue() : null;
        String source = (String) request.get("source");
        
        log.info("初始化分块上传: 文件={}, 大小={} bytes", fileName, fileSize);
        
        try {
            // 生成上传会话ID
            String sessionId = UUID.randomUUID().toString();
            
            Map<String, Object> result = new HashMap<>();
            result.put("sessionId", sessionId);
            result.put("chunkSize", 5 * 1024 * 1024); // 5MB per chunk
            result.put("message", "分块上传会话已创建");
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            log.error("初始化分块上传失败", e);
            return ApiResponse.error("初始化失败: " + e.getMessage());
        }
    }

    /**
     * 上传单个分块
     */
    @PostMapping(value = "/upload/chunk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> uploadChunk(
            @RequestPart("chunk") MultipartFile chunk,
            @RequestParam("sessionId") String sessionId,
            @RequestParam("chunkIndex") int chunkIndex,
            @RequestParam("totalChunks") int totalChunks,
            @RequestParam(value = "logType", defaultValue = "auto") String logType,
            @RequestParam(value = "parseRuleId", required = false) Long parseRuleId,
            @RequestParam(value = "source", required = false) String source,
            @RequestParam(value = "isLastChunk", defaultValue = "false") Boolean isLastChunk) {
        
        log.info("上传分块: sessionId={}, index={}/{}, 大小={} bytes", 
            sessionId, chunkIndex, totalChunks, chunk.getSize());
        
        try {
            // 获取解析规则
            ParseRule parseRule = null;
            if (parseRuleId != null) {
                Optional<ParseRule> ruleOpt = parseRuleService.getRuleById(parseRuleId);
                if (ruleOpt.isEmpty()) {
                    return ApiResponse.error("解析规则不存在: " + parseRuleId);
                }
                parseRule = ruleOpt.get();
                logType = parseRule.getLogType();
            }
            
            String logSource = source != null ? source : "chunk_upload_" + sessionId;
            
            // 流式处理当前分块
            Map<String, Object> chunkResult = processWithStream(
                chunk.getInputStream(), logType, parseRule, logSource);
            
            chunkResult.put("chunkIndex", chunkIndex);
            chunkResult.put("totalChunks", totalChunks);
            chunkResult.put("isLastChunk", isLastChunk);
            
            if (isLastChunk) {
                chunkResult.put("message", "最后一个分块已处理，上传完成");
            } else {
                chunkResult.put("message", "分块已处理，等待更多分块");
            }
            
            return ApiResponse.success("分块上传成功", chunkResult);
            
        } catch (Exception e) {
            log.error("分块上传失败: sessionId={}, index={}", sessionId, chunkIndex, e);
            return ApiResponse.error("分块上传失败: " + e.getMessage());
        }
    }

    /**
     * 直接提交日志文本（多行）
     */
    @PostMapping("/upload/text")
    public ApiResponse<Map<String, Object>> uploadLogText(
            @RequestBody LogUploadRequest request,
            @RequestParam(value = "text", required = false) String text,
            @RequestBody(required = false) Map<String, String> body) {
        
        String logText = text != null ? text : (body != null ? body.get("text") : null);
        
        if (logText == null || logText.trim().isEmpty()) {
            return ApiResponse.error("日志文本不能为空");
        }
        
        log.info("上传日志文本: 类型={}", request.getLogType());
        
        try {
            List<String> lines = Arrays.asList(logText.split("\\r?\\n"));
            
            // 获取解析规则
            ParseRule parseRule = null;
            String logType = request.getLogType();
            
            if (request.getParseRuleId() != null) {
                Optional<ParseRule> ruleOpt = parseRuleService.getRuleById(request.getParseRuleId());
                if (ruleOpt.isEmpty()) {
                    return ApiResponse.error("解析规则不存在: " + request.getParseRuleId());
                }
                parseRule = ruleOpt.get();
                logType = parseRule.getLogType();
            }
            
            // 解析日志
            List<LogEntry> entries = logParserService.parseLogLines(lines, logType, parseRule);
            
            // 设置来源
            String source = request.getSource() != null ? request.getSource() : "text_upload";
            for (LogEntry entry : entries) {
                if (entry.getSource() == null) {
                    entry.setSource(source);
                }
            }
            
            // 批量保存
            int savedCount = logService.bulkSaveLogEntries(entries);
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalLines", lines.size());
            result.put("parsedCount", entries.size());
            result.put("savedCount", savedCount);
            result.put("logType", logType);
            result.put("source", source);
            
            log.info("日志文本上传完成: 总行数={}, 解析成功={}, 保存成功={}", 
                lines.size(), entries.size(), savedCount);
            
            return ApiResponse.success("日志上传成功", result);
            
        } catch (Exception e) {
            log.error("上传日志文本失败", e);
            return ApiResponse.error("上传失败: " + e.getMessage());
        }
    }

    /**
     * 测试解析规则（不保存到数据库）
     */
    @PostMapping("/parse/test")
    public ApiResponse<Map<String, Object>> testParseRule(
            @RequestBody Map<String, Object> request) {
        
        String logText = (String) request.get("logText");
        String logType = (String) request.getOrDefault("logType", "auto");
        String ruleType = (String) request.get("ruleType");
        String pattern = (String) request.get("pattern");
        String fieldMappingJson = (String) request.get("fieldMapping");
        
        if (logText == null || logText.trim().isEmpty()) {
            return ApiResponse.error("测试日志不能为空");
        }
        
        log.info("测试解析规则: 类型={}, 规则类型={}", logType, ruleType);
        
        try {
            List<String> lines = Arrays.asList(logText.split("\\r?\\n"));
            
            // 创建临时解析规则
            ParseRule tempRule = null;
            if (ruleType != null && pattern != null) {
                tempRule = new ParseRule();
                tempRule.setRuleType(ruleType);
                tempRule.setPattern(pattern);
                tempRule.setFieldMapping(fieldMappingJson);
                tempRule.setLogType(logType);
            }
            
            // 解析日志
            List<LogEntry> entries = logParserService.parseLogLines(lines, logType, tempRule);
            
            // 准备结果
            List<Map<String, Object>> parsedResults = new ArrayList<>();
            for (LogEntry entry : entries) {
                Map<String, Object> entryMap = new HashMap<>();
                entryMap.put("timestamp", entry.getTimestamp());
                entryMap.put("level", entry.getLevel());
                entryMap.put("message", entry.getMessage());
                entryMap.put("rawLog", entry.getRawLog());
                entryMap.put("logType", entry.getLogType());
                entryMap.put("fields", entry.getFields());
                parsedResults.add(entryMap);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalLines", lines.size());
            result.put("parsedCount", entries.size());
            result.put("results", parsedResults);
            
            return ApiResponse.success("解析测试完成", result);
            
        } catch (Exception e) {
            log.error("测试解析规则失败", e);
            return ApiResponse.error("解析测试失败: " + e.getMessage());
        }
    }
}
