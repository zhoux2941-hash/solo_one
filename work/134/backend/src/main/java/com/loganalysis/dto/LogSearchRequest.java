package com.loganalysis.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 日志搜索请求 DTO
 */
@Data
public class LogSearchRequest {

    /**
     * 开始时间
     */
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    private LocalDateTime endTime;

    /**
     * 关键词
     */
    private String keyword;

    /**
     * 日志级别
     */
    private String level;

    /**
     * 日志类型
     */
    private String logType;

    /**
     * 来源
     */
    private String source;

    /**
     * 页码（从 0 开始）
     */
    private int page = 0;

    /**
     * 每页大小
     */
    private int size = 20;
}
