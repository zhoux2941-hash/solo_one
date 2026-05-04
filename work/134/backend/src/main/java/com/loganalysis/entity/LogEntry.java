package com.loganalysis.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 日志条目实体类，存储在 Elasticsearch 中
 */
@Document(indexName = "logs")
@Data
public class LogEntry {

    @Id
    private String id;

    /**
     * 日志时间戳
     */
    @Field(type = FieldType.Date, format = {}, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime timestamp;

    /**
     * 日志级别 (DEBUG, INFO, WARN, ERROR, FATAL)
     */
    @Field(type = FieldType.Keyword)
    private String level;

    /**
     * 日志消息
     */
    @Field(type = FieldType.Text, analyzer = "standard")
    private String message;

    /**
     * 原始日志行
     */
    @Field(type = FieldType.Text)
    private String rawLog;

    /**
     * 日志来源 (文件名或上传标识)
     */
    @Field(type = FieldType.Keyword)
    private String source;

    /**
     * 日志类型 (nginx, apache, json_lines, custom)
     */
    @Field(type = FieldType.Keyword)
    private String logType;

    /**
     * 额外的结构化字段
     */
    @Field(type = FieldType.Object)
    private Map<String, Object> fields;

    /**
     * 创建时间
     */
    @Field(type = FieldType.Date)
    private LocalDateTime createdAt;
}
